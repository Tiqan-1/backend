import { Injectable, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { CreateTaskDto, TaskDto, UpdateTaskDto } from './dto/task.dto'
import { TasksRepository } from './tasks.repository'

@Injectable()
export class TasksService {
    constructor(
        private readonly taskRepository: TasksRepository,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(task: CreateTaskDto): Promise<CreatedDto> {
        const lessons = (await this.documentsService.getLessons(task.lessonIds))?.map(lesson => lesson._id) ?? []
        const createObject = lessons ? { date: task.date, lessons } : { date: task.date }
        const document = await this.taskRepository.create(createObject)
        return { id: document._id.toString() }
    }

    async update(id: string, task: UpdateTaskDto): Promise<void> {
        const taskId = new ObjectId(id)
        const lessons = (await this.documentsService.getLessons(task.lessonIds))?.map(lesson => lesson._id)
        const updateObject = lessons ? { date: task.date, lessons } : { date: task.date }
        const updated = await this.taskRepository.update({ _id: taskId }, updateObject)
        if (!updated) {
            throw new NotFoundException('Task not found.')
        }
    }

    async remove(id: string): Promise<void> {
        const deleted = await this.taskRepository.remove({ _id: new ObjectId(id) })
        if (!deleted) {
            throw new NotFoundException('Task not found.')
        }
    }

    async findById(id: string): Promise<TaskDto> {
        const taskId = new ObjectId(id)
        const found = await this.taskRepository.findByIdPopulated(taskId)
        if (!found) {
            throw new NotFoundException('Task not found.')
        }
        return TaskDto.fromDocument(found)
    }
}
