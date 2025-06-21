import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { TasksService } from '../tasks/tasks.service'
import { CreateLevelDto, LevelDto, SearchLevelsQueryDto, UpdateLevelDto } from './dto/level.dto'
import { PaginatedLevelDto } from './dto/paginated-level.dto'
import { LevelState } from './enums/level-stats.enum'
import { LevelsRepository } from './levels.repository'

@Injectable()
export class LevelsService {
    private readonly logger = new Logger(LevelsService.name)

    constructor(
        private readonly levelsRepository: LevelsRepository,
        private readonly tasksService: TasksService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(dto: CreateLevelDto, createdBy: ObjectId): Promise<CreatedDto> {
        const program = await this.documentsService.getProgram(dto.programId)
        if (!program) {
            this.logger.error(`Program ${dto.programId} not found.`)
            throw new NotFoundException('Program not found.')
        }
        const created = await this.levelsRepository.create({ ...dto, createdBy, programId: program._id })
        ;(program.levels as ObjectId[]).push(created._id)
        await program.save()
        const createdId = created._id.toString()
        this.logger.log(`Level ${createdId} created.`)
        return { id: createdId }
    }

    async find(query: SearchLevelsQueryDto): Promise<PaginatedLevelDto> {
        let programLevels: ObjectId[] | undefined
        if (query.programId) {
            const program = await this.documentsService.getProgram(query.programId)
            if (!program?.levels.length) {
                this.logger.warn(`Program ${query.programId} not found or has no lessons.`)
                return PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            programLevels = program.levels as ObjectId[]
        }
        const filterBuilder = SearchFilterBuilder.init()
        if (query.id) {
            if (programLevels && !programLevels.some(id => id.equals(query.id))) {
                this.logger.warn(`Lesson ${query.id} requested but not found within program ${query.programId}.`)
                return PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            filterBuilder.withObjectId('_id', query.id)
        } else if (programLevels) {
            filterBuilder.withObjectIds('_id', programLevels)
        }

        filterBuilder.withStringLike('name', query.name).withDateAfter('start', query.start).withDateBefore('end', query.end)

        const filter = filterBuilder.build()

        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.levelsRepository.find(filter, query.pageSize, skip),
            await this.levelsRepository.countDocuments(filter),
        ])

        return PaginationHelper.wrapResponse(LevelDto.fromDocuments(found), query.page, query.pageSize, total)
    }

    async update(id: string, dto: UpdateLevelDto): Promise<void> {
        const updated = await this.levelsRepository.update({ _id: new ObjectId(id), state: { $ne: LevelState.deleted } }, dto)
        if (!updated) {
            this.logger.error(`Attempt to update level ${id} failed.`)
            throw new NotFoundException('Level Not Found')
        }
    }

    async remove(id: string): Promise<void> {
        const found = await this.levelsRepository.update(
            { _id: new ObjectId(id) },
            { state: LevelState.deleted, expireAt: oneMonth }
        )
        if (!found) {
            this.logger.error(`Attempt to remove level ${id} failed.`)
            throw new NotFoundException('Level Not Found')
        }
        const program = await this.documentsService.getProgram(found.programId.toString())
        if (program) {
            const levelIndex = program.levels.findIndex(level => level._id.toString() === id)
            if (levelIndex === -1) {
                this.logger.warn(`Attempt to remove level ${id} from program ${program._id.toString()} failed.`)
            } else {
                ;(program.levels as ObjectId[]).splice(levelIndex, 1)
                await program.save()
            }
        }
        for (const task of found.tasks) {
            await this.tasksService.remove(task._id.toString())
        }
        this.logger.log(`Level ${id} removed.`)
    }
}
