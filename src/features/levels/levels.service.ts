import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { CreateTaskDto, TaskDto } from '../tasks/dto/task.dto'
import { TaskDocument } from '../tasks/schemas/task.schema'
import { TasksService } from '../tasks/tasks.service'
import { CreateLevelDto, LevelDto, UpdateLevelDto } from './dto/level.dto'
import { LevelsRepository } from './levels.repository'
import { LevelDocument } from './schemas/level.schema'

@Injectable()
export class LevelsService {
    constructor(
        private readonly levelsRepository: LevelsRepository,
        private readonly tasksService: TasksService
    ) {}

    async create(dto: CreateLevelDto): Promise<CreatedDto> {
        const created = await this.levelsRepository.create(dto)
        return { id: created._id.toString() }
    }

    async findOne(id: string): Promise<LevelDto> {
        const found: LevelDocument | undefined = await this.levelsRepository.findById(new ObjectId(id))
        if (!found) {
            throw new NotFoundException('Level Not Found')
        }
        await found.populate({ path: 'tasks', perDocumentLimit: 10, populate: { path: 'lessons', perDocumentLimit: 20 } })
        return LevelDto.fromDocument(found)
    }

    async update(id: string, dto: UpdateLevelDto): Promise<void> {
        const updated = await this.levelsRepository.update({ _id: new ObjectId(id) }, dto)
        if (!updated) {
            throw new NotFoundException('Level Not Found')
        }
    }

    async remove(id: string): Promise<void> {
        const removed = await this.levelsRepository.remove({ _id: new ObjectId(id) })
        if (!removed) {
            throw new NotFoundException('Level Not Found')
        }
    }

    async createTask(levelId: string, createTaskDto: CreateTaskDto): Promise<CreatedDto> {
        const level = await this.loadLevel(levelId)
        const task = await this.tasksService.create(createTaskDto)
        ;(level.tasks as ObjectId[]).push(new ObjectId(task.id))
        await level.save()
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
            throw new NotFoundException('Task not found.')
        }
        ;(level.tasks as ObjectId[]).splice(taskIndex, 1)
        await this.tasksService.remove(taskId)
        await level.save()
    }

    private async loadLevel(id: string): Promise<LevelDocument> {
        const level = await this.levelsRepository.findById(new ObjectId(id))
        if (!level) {
            throw new NotFoundException('Level not found')
        }
        return level
    }
}
