import {
    ConflictException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotAcceptableException,
    NotFoundException,
} from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentResponsesRepository } from '../assignment-responses/assignment-responses.repository'
import { AssignmentResponseStatus } from '../assignment-responses/enums/assignment-response-status.enum'
import { LevelDocument } from '../levels/schemas/level.schema'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { TasksService } from '../tasks/tasks.service'
import { AssignmentsRepository } from './assignments.repository'
import {
    AssignmentDto,
    CreateAssignmentDto,
    PaginatedAssignmentDto,
    SearchAssignmentQueryDto,
    UpdateAssignmentDto,
} from './dto/assignment.dto'
import { PaginatedAssignmentStudentDto, StudentAssignmentDto } from './dto/student-assignment.dto'
import { AssignmentGradingState } from './enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from './enums/assignment-state.enum'
import { AssignmentDocument } from './schemas/assignment.schema'

@Injectable()
export class AssignmentsService {
    private readonly logger = new Logger(AssignmentsService.name)

    constructor(
        private readonly assignmentsRepository: AssignmentsRepository,
        @Inject(forwardRef(() => AssignmentResponsesRepository))
        private readonly responsesRepository: AssignmentResponsesRepository,
        private readonly tasksService: TasksService,
        private readonly subscriptionsRepository: SubscriptionsRepository,
        private readonly i18n: I18nService
    ) {}

    async create(createAssignmentDto: CreateAssignmentDto, createdBy: ObjectId): Promise<CreatedDto> {
        const data = { ...createAssignmentDto, createdBy }
        const created = await this.assignmentsRepository.create(data)
        this.logger.log(`Assignment ${created.id} created by ${createdBy.toString()}.`)
        return { id: created._id.toString() }
    }

    async findForManager(assignmentId: ObjectId, managerId: ObjectId): Promise<AssignmentDto> {
        const assignment = await this.assignmentsRepository.findById(assignmentId)

        if (!assignment) {
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        if (!assignment.createdBy._id.equals(managerId)) {
            throw new ForbiddenException(this.i18n.t('assignments.errors.assignmentNotOwnedByManager'))
        }

        return AssignmentDto.fromDocument(assignment)
    }

    async findForStudent(assignmentId: ObjectId, studentId: ObjectId): Promise<AssignmentDto> {
        const assignment = await this.assignmentsRepository.findById(assignmentId)
        if (!assignment) {
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        const subscriptions = await this.subscriptionsRepository.find({ subscriber: studentId, state: SubscriptionState.active })
        const taskIdsForStudent = subscriptions.flatMap(sub =>
            (sub.program as ProgramDocument).levels.flatMap(level => (level as LevelDocument).tasks.map(task => task._id))
        )
        if (assignment.taskId && !taskIdsForStudent.includes(assignment.taskId)) {
            throw new ForbiddenException(this.i18n.t('assignments.errors.notAuthorized'))
        }

        return AssignmentDto.fromDocument(assignment, true)
    }

    async search(query: SearchAssignmentQueryDto, createdById?: ObjectId): Promise<PaginatedAssignmentDto> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', query.id)
            .withObjectId('createdBy', createdById)
            .withParam('state', query.state)
            .withStringLike('type', query.type)
            .withStringLike('title', query.title)
            .withDateAfter('availableFrom', query.availableFrom)
            .withDateBefore('availableUntil', query.availableUntil)
            .withDateAfter('createdAt', query.createdAt)
            .build()

        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.assignmentsRepository.find(filter, query.pageSize, skip),
            await this.assignmentsRepository.countDocuments(filter),
        ])
        return PaginationHelper.wrapResponse(AssignmentDto.fromDocuments(found), query.page, query.pageSize, total)
    }

    async update(assignmentId: ObjectId, updateAssignmentDto: UpdateAssignmentDto, managerId: ObjectId): Promise<void> {
        const assignment = await this.assignmentsRepository.findRawById(assignmentId)
        if (!assignment) {
            this.logger.error(`Assignment with id ${assignmentId.toString()} not found`)
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        this.validateEditability(assignment, managerId, updateAssignmentDto)

        await assignment.updateOne({ ...updateAssignmentDto })
    }

    async remove(assignmentId: ObjectId, managerObjectId: ObjectId): Promise<void> {
        const assignment = await this.assignmentsRepository.findRawById(assignmentId)
        if (!assignment) {
            this.logger.error(`Assignment with id ${assignmentId.toString()} not found`)
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        this.validateEditability(assignment, managerObjectId, undefined)

        await assignment.updateOne({ state: AssignmentState.deleted })

        if (assignment.taskId) {
            await this.tasksService.remove(assignment.taskId.toString())
        }
    }

    async findAvailableForStudent(studentId: ObjectId): Promise<PaginatedAssignmentStudentDto> {
        const subscriptions = await this.subscriptionsRepository.find({ subscriber: studentId, state: SubscriptionState.active })
        const taskIds = subscriptions.flatMap(sub =>
            (sub.program as ProgramDocument).levels.flatMap(level => (level as LevelDocument).tasks.map(task => task._id))
        )
        if (taskIds.length === 0) {
            // No active subscriptions, so no available assignments
            return PaginationHelper.wrapResponse([])
        }

        // Find all published exams for those taskIds that are currently active
        const filter = SearchFilterBuilder.init()
            .withObjectIds('taskId', taskIds)
            .withParam('state', AssignmentState.published)
            .withParam('type', AssignmentType.exam)
            .build()

        const skip = PaginationHelper.calculateSkip()

        const [found, total] = await Promise.all([
            await this.assignmentsRepository.find(filter, 10, skip),
            await this.assignmentsRepository.countDocuments(filter),
        ])

        return PaginationHelper.wrapResponse(
            found.map(assignment => this.mapToStudentAssignmentDto(assignment)),
            1,
            100,
            total
        )
    }

    async publishGrades(assignmentId: ObjectId, managerId: ObjectId): Promise<void> {
        const assignment = await this.assignmentsRepository.findRawById(assignmentId)
        if (!assignment) {
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        // Authorization
        if (assignment.createdBy !== managerId) {
            throw new ForbiddenException(this.i18n.t('assignments.errors.assignmentNotOwnedByManager'))
        }
        if (assignment.gradingState === AssignmentGradingState.published) {
            throw new NotAcceptableException(this.i18n.t('assignments.errors.gradesAlreadyPublished'))
        }

        // Fetch all responses for this assignment
        const responses = await this.responsesRepository.find({ assignmentId })

        if (responses.length === 0) {
            this.logger.error(
                `Manager ${managerId.toString()} attempt to publish grades for assignment ${assignmentId.toString()} which has no submissions.`
            )
            throw new NotAcceptableException(this.i18n.t('assignments.errors.noSubmissions'))
        }

        // Validation: Ensure all are graded
        const allGraded = responses.every(r => r.status === AssignmentResponseStatus.graded)
        if (!allGraded) {
            throw new ConflictException(this.i18n.t('assignments.errors.notAllSubmissionsGraded'))
        }

        // Perform Bulk Update on responses
        await this.responsesRepository.updateMany(
            { assignmentId: assignmentId, status: AssignmentResponseStatus.graded },
            { $set: { status: AssignmentResponseStatus.published } }
        )

        // Update the Assignment's state
        await this.assignmentsRepository.update({ _id: assignmentId }, { gradingState: AssignmentGradingState.published })

        this.logger.log(`Manager ${managerId.toString()} published grades for assignment ${assignmentId.toString()}.`)
    }

    private validateEditability(
        assignment: AssignmentDocument,
        managerId: ObjectId,
        updateDto: UpdateAssignmentDto | undefined
    ): void {
        if (assignment.createdBy !== managerId) {
            this.logger.error(
                `Permission Denied: Manager ${managerId.toString()} trying to access assignment ${assignment._id.toString()}`
            )
            throw new ForbiddenException(this.i18n.t('assignments.errors.assignmentNotOwnedByManager'))
        }

        if (assignment.state === AssignmentState.published && updateDto?.form !== undefined) {
            this.logger.error(
                `Permission Denied: Manager ${managerId.toString()} trying to editing a published assignment ${assignment._id.toString()}`
            )
            throw new ForbiddenException(this.i18n.t('assignments.errors.publishedAssignmentCannotBeEdited'))
        }
        if (assignment.state === AssignmentState.closed && updateDto?.form !== undefined) {
            this.logger.error(
                `Permission Denied: Manager ${managerId.toString()} trying to editing a closed assignment ${assignment._id.toString()}`
            )
            throw new ForbiddenException(this.i18n.t('assignments.errors.closedAssignmentCannotBeEdited'))
        }
    }

    private mapToStudentAssignmentDto(assignment: AssignmentDocument): StudentAssignmentDto {
        //TODO add form to assignment dto
        return {
            id: assignment._id.toString(),
            title: assignment.title,
            type: assignment.type,
            durationInMinutes: assignment.durationInMinutes,
            availableFrom: assignment.availableFrom,
            availableUntil: assignment.availableUntil,
            taskId: assignment.taskId?.toString(),
        }
    }
}
