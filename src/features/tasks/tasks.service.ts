import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { LessonsService } from '../lessons/lessons.service'
import { CreateTaskDto, TaskDto, UpdateTaskDto } from './dto/task.dto'
import { TasksRepository } from './tasks.repository'

@Injectable()
export class TasksService {
    constructor(
        private readonly taskRepository: TasksRepository,
        private readonly lessonsService: LessonsService
    ) {}

    @HandleBsonErrors()
    async create(task: CreateTaskDto): Promise<CreatedDto> {
        const lessonsObjectIds = await this.lessonsService.validateLessonIds(task.lessonIds)
        const createObject = {
            date: task.date,
            lessons: lessonsObjectIds,
        }
        const document = await this.taskRepository.create(createObject)
        return { id: document._id.toString() }
    }

    @HandleBsonErrors()
    async update(id: string, task: UpdateTaskDto): Promise<void> {
        const taskId = new ObjectId(id)
        const lessonsObjectIds = task.lessonIds && (await this.lessonsService.validateLessonIds(task.lessonIds))
        const updateObject = {
            date: task.date,
            lessons: lessonsObjectIds,
        }
        const updated = await this.taskRepository.update({ _id: taskId }, updateObject)
        if (!updated) {
            throw new NotFoundException('Task not found.')
        }
    }

    @HandleBsonErrors()
    async remove(id: string): Promise<void> {
        const taskId = new ObjectId(id)
        const deleted = await this.taskRepository.remove({ _id: taskId })
        if (!deleted) {
            throw new NotFoundException('Task not found.')
        }
    }

    @HandleBsonErrors()
    async findById(id: string): Promise<TaskDto> {
        const taskId = new ObjectId(id)
        const found = await this.taskRepository.findByIdPopulated(taskId)
        if (!found) {
            throw new NotFoundException('Task not found.')
        }
        return TaskDto.fromDocument(found)
    }

    @HandleBsonErrors()
    async validateTaskIds(taskIds: string[] = []): Promise<ObjectId[]> {
        const tasksObjectIds = taskIds.map(id => new ObjectId(id))
        const tasks = await this.taskRepository.findManyByIds(tasksObjectIds)
        if (!tasks || tasks.length !== taskIds.length) {
            throw new BadRequestException('some tasks not found with the given taskIds')
        }
        return tasksObjectIds
    }
}
