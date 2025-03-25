import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { ProgramsService } from '../programs/programs.service'
import { TasksService } from '../tasks/tasks.service'
import { CreateLevelDto, LevelDto, UpdateLevelDto } from './dto/level.dto'
import { LevelsRepository } from './levels.repository'
import { LevelDocument } from './schemas/level.schema'

@Injectable()
export class LevelsService {
    constructor(
        private readonly levelsRepository: LevelsRepository,
        private readonly programsService: ProgramsService,
        private readonly tasksService: TasksService
    ) {}

    async create(dto: CreateLevelDto): Promise<CreatedDto> {
        const { programId, taskIds, ...createDocument } = dto
        const tasks = await this.tasksService.validateTaskIds(taskIds)
        const created = await this.levelsRepository.create({ ...createDocument, tasks })
        await this.programsService.addLevel(programId, created._id)
        return { id: created._id.toString() }
    }

    @HandleBsonErrors()
    async findOne(id: string): Promise<LevelDto> {
        const found: LevelDocument | undefined = await this.levelsRepository.findById(new ObjectId(id))
        if (!found) {
            throw new NotFoundException('Level Not Found')
        }
        await found.populate({ path: 'tasks', perDocumentLimit: 20, populate: { path: 'lessons', perDocumentLimit: 20 } })
        return LevelDto.fromDocument(found)
    }

    @HandleBsonErrors()
    async update(id: string, dto: UpdateLevelDto): Promise<void> {
        const { taskIds, ...updateDocument } = dto
        const tasks = await this.tasksService.validateTaskIds(taskIds)
        const updated = await this.levelsRepository.update({ _id: new ObjectId(id) }, { ...updateDocument, tasks })
        if (!updated) {
            throw new NotFoundException('Level Not Found')
        }
    }

    @HandleBsonErrors()
    async remove(id: string): Promise<void> {
        const removed = await this.levelsRepository.remove({ _id: new ObjectId(id) })
        if (!removed) {
            throw new NotFoundException('Level Not Found')
        }
    }
}
