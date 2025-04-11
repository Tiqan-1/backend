import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { CreateTaskDto, TaskDto } from '../tasks/dto/task.dto'
import { TaskDocument } from '../tasks/schemas/task.schema'
import { TasksService } from '../tasks/tasks.service'
import { CreateLevelDto, LevelDto, UpdateLevelDto } from './dto/level.dto'
import { LevelState } from './enums/level-stats.enum'
import { LevelsRepository } from './levels.repository'
import { LevelDocument } from './schemas/level.schema'

@Injectable()
export class LevelsService {
    private readonly logger = new Logger(LevelsService.name)

    constructor(
        private readonly levelsRepository: LevelsRepository,
        private readonly tasksService: TasksService
    ) {}

    async create(dto: CreateLevelDto): Promise<CreatedDto> {
        const created = await this.levelsRepository.create(dto)
        const createdId = created._id.toString()
        this.logger.log(`Level ${createdId} created.`)
        return { id: createdId }
    }

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
        for (const task of found.tasks) {
            await this.tasksService.remove(task._id.toString())
        }
        this.logger.log(`Level ${id} removed.`)
    }

    async createTask(levelId: string, createTaskDto: CreateTaskDto): Promise<CreatedDto> {
        const level = await this.loadLevel(levelId)
        const task = await this.tasksService.create(createTaskDto)
        ;(level.tasks as ObjectId[]).push(new ObjectId(task.id))
        await level.save()
        this.logger.log(`Task ${task.id} created and added to level ${levelId}.`)
        return task
    }

    async getTasks(id: string): Promise<TaskDto[]> {
        const level = await this.loadLevel(id)
        await level.populate({ path: 'tasks', populate: { path: 'lessons', perDocumentLimit: 10 } })
        return TaskDto.fromDocuments(level.tasks as TaskDocument[])
    }

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

    private async loadLevel(id: string): Promise<LevelDocument> {
        const level = await this.levelsRepository.findById(new ObjectId(id))
        if (!level || level.state === LevelState.deleted) {
            this.logger.log(`Attempt to load level ${id} failed.`, level)
            throw new NotFoundException('Level not found')
        }
        return level
    }
}
