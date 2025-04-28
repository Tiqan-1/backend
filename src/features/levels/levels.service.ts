import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { CreateTaskDto, TaskDto } from '../tasks/dto/task.dto'
import { TaskDocument } from '../tasks/schemas/task.schema'
import { TasksService } from '../tasks/tasks.service'
import { CreateLevelDto, LevelDto, SearchLevelsQueryDto, UpdateLevelDto } from './dto/level.dto'
import { LevelState } from './enums/level-stats.enum'
import { LevelsRepository } from './levels.repository'
import { LevelDocument } from './schemas/level.schema'

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
        const created = await this.levelsRepository.create({ ...dto, createdBy, programId: program._id })
        ;(program.levels as ObjectId[]).push(created._id)
        await program.save()
        const createdId = created._id.toString()
        this.logger.log(`Level ${createdId} created.`)
        return { id: createdId }
    }

    async find(query: SearchLevelsQueryDto): Promise<LevelDto[]> {
        let programLevels: ObjectId[] | undefined
        if (query.programId) {
            const program = await this.documentsService.getProgram(query.programId)
            if (!program?.levels.length) {
                this.logger.warn(`Program ${query.programId} not found or has no lessons.`)
                return []
            }
            programLevels = program.levels as ObjectId[]
        }
        const filterBuilder = SearchFilterBuilder.init()
        if (query.id) {
            if (programLevels && !programLevels.some(id => id.equals(query.id))) {
                this.logger.warn(`Lesson ${query.id} requested but not found within program ${query.programId}.`)
                return []
            }
            filterBuilder.withObjectId('_id', query.id)
        } else if (programLevels) {
            filterBuilder.withObjectIds('_id', programLevels)
        }

        filterBuilder.withStringLike('name', query.name).withDateAfter('start', query.start).withDateBefore('end', query.end)

        const filter = filterBuilder.build()
        const limit = query.limit
        const skip = query.skip

        const found = await this.levelsRepository.find(filter, limit, skip)
        return LevelDto.fromDocuments(found)
    }

    /** @deprecated */
    async findOne(id: string): Promise<LevelDto> {
        const found: LevelDocument | undefined = await this.loadLevel(id)
        await found.populate({ path: 'tasks', perDocumentLimit: 10, populate: { path: 'lessons', perDocumentLimit: 20 } })
        return LevelDto.fromDocument(found)
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
            await this.tasksService.oldRemove(task._id.toString())
        }
        this.logger.log(`Level ${id} removed.`)
    }

    /** @deprecated */
    async createTask(levelId: string, createTaskDto: CreateTaskDto, createdBy: ObjectId): Promise<CreatedDto> {
        const level = await this.loadLevel(levelId)
        const task = await this.tasksService.create(createTaskDto, createdBy)
        ;(level.tasks as ObjectId[]).push(new ObjectId(task.id))
        await level.save()
        this.logger.log(`Task ${task.id} created and added to level ${levelId}.`)
        return task
    }

    /** @deprecated */
    async getTasks(id: string): Promise<TaskDto[]> {
        const level = await this.loadLevel(id)
        await level.populate({ path: 'tasks', populate: { path: 'lessons', perDocumentLimit: 10 } })
        return TaskDto.fromDocuments(level.tasks as TaskDocument[])
    }

    /** @deprecated */
    async removeTask(levelId: string, taskId: string): Promise<void> {
        const level = await this.loadLevel(levelId)
        const taskIndex = level.tasks.findIndex(id => id._id.toString() === taskId)
        if (taskIndex === -1) {
            this.logger.error(`Attempt to remove task ${taskId} from ${levelId} failed.`)
            throw new NotFoundException('Task not found.')
        }
        ;(level.tasks as ObjectId[]).splice(taskIndex, 1)
        await this.tasksService.remove(taskId)
        this.logger.log(`Task ${taskId} removed from level ${levelId}.`)
        await level.save()
    }

    /** @deprecated */
    private async loadLevel(id: string): Promise<LevelDocument> {
        const level = await this.levelsRepository.findById(new ObjectId(id))
        if (!level || level.state === LevelState.deleted) {
            this.logger.log(`Attempt to load level ${id} failed.`, level)
            throw new NotFoundException('Level not found')
        }
        return level
    }
}
