import { Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { normalizeDate } from '../../shared/helper/date.helper'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentsRepository } from '../assignments/assignments.repository'
import { AssignmentDocument } from '../assignments/schemas/assignment.schema'
import { ChatService } from '../chat/chat.service'
import { LessonsService } from '../lessons/lessons.service'
import { PaginatedTaskDto } from './dto/paginated-task.dto'
import { CreateTaskDto, SearchTasksQueryDto, TaskDto, UpdateTaskDto } from './dto/task.dto'
import { TaskState } from './enums'
import { TaskDocument } from './schemas/task.schema'
import { TasksRepository } from './tasks.repository'

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name)

    constructor(
        private readonly taskRepository: TasksRepository,
        private readonly lessonsService: LessonsService,
        private readonly assignmentRepository: AssignmentsRepository,
        private readonly documentsService: SharedDocumentsService,
        private readonly chatService: ChatService,
        private readonly i18n: I18nService
    ) {}

    async create(task: CreateTaskDto, createdBy: ObjectId): Promise<CreatedDto> {
        if (task.type === 'lesson' && !task.lessonIds?.length) {
            this.logger.error(`LessonIds are required for task type ${task.type}.`)
            throw new NotAcceptableException(this.i18n.t('tasks.errors.lessonIdsRequired'))
        }
        let assignment: AssignmentDocument | undefined
        if (task.type === 'assignment') {
            if (!task.assignmentId) {
                this.logger.error(`AssignmentId is required for task type ${task.type}.`)
                throw new NotAcceptableException(this.i18n.t('tasks.errors.assignmentIdRequired'))
            }
            assignment = await this.assignmentRepository.findById(task.assignmentId)
            if (!assignment) {
                this.logger.error(`Assignment ${task.assignmentId.toString()} not found.`)
                throw new NotFoundException(this.i18n.t('tasks.errors.assignmentNotFound'))
            }
        }
        const validatedLessons = task.lessonIds?.length ? await this.lessonsService.validateLessonIds(task.lessonIds) : undefined
        const level = await this.documentsService.getLevel(task.levelId)
        if (!level) {
            this.logger.error(`Level ${task.levelId} not found.`)
            throw new NotFoundException(this.i18n.t('tasks.errors.levelNotFound'))
        }

        const createObject: Partial<TaskDocument> = {
            createdBy,
            levelId: new ObjectId(task.levelId),
            date: normalizeDate(new Date(task.date)),
            chatRoomId: task.hasChatRoom ? await this.chatService.createChatRoom(createdBy) : undefined,
            type: task.type,
            assignment: task.assignmentId,
            ...(task.note && { note: task.note }),
            ...(validatedLessons && { lessons: validatedLessons }),
        }

        const created = await this.taskRepository.create(createObject)

        ;(level.tasks as ObjectId[]).push(created._id)
        await level.save()

        if (assignment) {
            assignment.taskId = created._id
            await assignment.save()
        }

        this.logger.log(`Task ${created._id.toString()} created.`)
        return { id: created._id.toString() }
    }

    async find(query: SearchTasksQueryDto, createdBy: ObjectId): Promise<PaginatedTaskDto> {
        let levelTasks: ObjectId[] | undefined
        if (query.levelId) {
            const level = await this.documentsService.getLevel(query.levelId)
            if (!level?.tasks.length) {
                this.logger.warn(`Level ${query.levelId} not found or has no tasks.`)
                return PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            levelTasks = level.tasks as ObjectId[]
        }
        const filterBuilder = SearchFilterBuilder.init()
        if (query.id) {
            if (levelTasks && !levelTasks.some(id => id.equals(query.id))) {
                this.logger.warn(`Task ${query.id} requested but not found within level ${query.levelId}.`)
                return PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            filterBuilder.withObjectId('_id', query.id)
        } else if (levelTasks) {
            filterBuilder.withObjectIds('_id', levelTasks)
        }

        filterBuilder
            .withObjectId('createdBy', createdBy)
            .withDate('date', query.date && normalizeDate(new Date(query.date)))
            .withStringLike('note', query.note)

        const filter = filterBuilder.build()

        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            this.taskRepository.find(filter, query.pageSize, skip),
            this.taskRepository.countDocuments(filter),
        ])
        return PaginationHelper.wrapResponse(TaskDto.fromDocuments(found), query.page, query.pageSize, total)
    }

    async update(taskId: ObjectId, task: UpdateTaskDto, updatedBy: ObjectId): Promise<void> {
        const validatedLessons = task.lessonIds?.length ? await this.lessonsService.validateLessonIds(task.lessonIds) : undefined

        const taskFound = await this.taskRepository.findOne({ _id: taskId })

        if (task.hasChatRoom === false && taskFound?.chatRoomId) {
            await this.chatService.removeChatRoom(taskFound.chatRoomId)
        }

        const updateObject: Partial<TaskDocument> = {
            ...(task.date && { date: normalizeDate(new Date(task.date)) }),
            ...(task.note && { note: task.note }),
            chatRoomId: task.hasChatRoom ? await this.chatService.createChatRoom(updatedBy) : undefined,
            ...(validatedLessons && { lessons: validatedLessons }),
        }

        const updated = await this.taskRepository.update({ _id: taskId, state: { $ne: TaskState.deleted } }, updateObject)
        if (!updated) {
            this.logger.error(`Attempt to update Task ${taskId.toString()} failed.`)
            throw new NotFoundException(this.i18n.t('tasks.errors.taskNotFound'))
        }
    }

    async remove(id: string): Promise<void> {
        const deleted = await this.taskRepository.update(
            { _id: new ObjectId(id) },
            { state: TaskState.deleted, expireAt: oneMonth }
        )
        if (!deleted) {
            this.logger.error(`Attempt to remove Task ${id} failed.`)
            throw new NotFoundException(this.i18n.t('tasks.errors.taskNotFound'))
        }
        const level = await this.documentsService.getLevel(deleted.levelId.toString())
        if (level) {
            const taskIndex = level.tasks.findIndex(task => task._id.toString() === id)
            if (taskIndex === -1) {
                this.logger.warn(`Attempt to remove Task ${id} from level ${level._id.toString()} failed.`)
            } else {
                ;(level.tasks as ObjectId[]).splice(taskIndex, 1)
                await level.save()
            }
        }
        this.logger.log(`Task ${id} removed.`)
    }
}
