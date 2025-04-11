import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { LessonsService } from '../lessons/lessons.service'
import { CreateTaskDto, TaskDto, UpdateTaskDto } from './dto/task.dto'
import { TaskState } from './enums'
import { TasksRepository } from './tasks.repository'

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        private readonly taskRepository: TasksRepository,
        private readonly lessonsService: LessonsService
    ) {}

    async create(task: CreateTaskDto): Promise<CreatedDto> {
        const createObject: { date?: Date; lessons?: ObjectId[] } = { date: task.date }
        if (task.lessonIds?.length) {
            createObject.lessons = await this.lessonsService.validateLessonIds(task.lessonIds)
        }
        const created = await this.taskRepository.create(createObject)
        this.logger.log(`Task ${created._id.toString()} created.`)
        return { id: created._id.toString() }
    }

    async update(id: string, task: UpdateTaskDto): Promise<void> {
        const taskId = new ObjectId(id)
        const updateObject: { date?: Date; lessons?: ObjectId[] } = { date: task.date }
        if (task.lessonIds?.length) {
            updateObject.lessons = await this.lessonsService.validateLessonIds(task.lessonIds)
        }
        const updated = await this.taskRepository.update({ _id: taskId, state: { $ne: TaskState.deleted } }, updateObject)
        if (!updated) {
            this.logger.error(`Attempt to update Task ${id} failed.`)
            throw new NotFoundException('Task not found.')
        }
    }

    async remove(id: string): Promise<void> {
        const deleted = await this.taskRepository.update(
            { _id: new ObjectId(id) },
            { state: TaskState.deleted, expireAt: oneMonth }
        )
        if (!deleted) {
            this.logger.error(`Attempt to remove Task ${id} failed.`)
            throw new NotFoundException('Task not found.')
        }
        this.logger.log(`Task ${id} removed.`)
    }

    async findById(id: string): Promise<TaskDto> {
        const taskId = new ObjectId(id)
        const found = await this.taskRepository.findByIdPopulated(taskId)
        if (!found || found.state === TaskState.deleted) {
            this.logger.error(`Attempt to find Task ${id} failed.`)
            throw new NotFoundException('Task not found.')
        }
        return TaskDto.fromDocument(found)
    }
}
