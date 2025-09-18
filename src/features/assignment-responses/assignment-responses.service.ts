import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotAcceptableException,
    NotFoundException,
} from '@nestjs/common'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'

import { isAfter, isBefore } from 'date-fns'
import { I18nService } from 'nestjs-i18n'
import { AssignmentFormValidator } from '../assignments/assignment-form.validator'
import { AssignmentsRepository } from '../assignments/assignments.repository'
import { AssignmentState } from '../assignments/enums/assignment-state.enum'
import { AssignmentDocument } from '../assignments/schemas/assignment.schema'
import { Question } from '../assignments/types/form.type'
import { Role } from '../authentication/enums/role.enum'
import { TokenUser } from '../authentication/types/token-user'
import { LevelDocument } from '../levels/schemas/level.schema'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import {
    AssignmentResponseDto,
    PaginatedAssignmentResponseDto,
    SearchAssignmentResponseQueryDto,
} from './dto/assignment-response.dto'
import { ManualGradeDto } from './dto/manual-grade.dto'
import { AssignmentResponseMapping } from './dto/mapping'
import { StartAssignmentResponseDto } from './dto/start-assignment.response.dto'
import { AssignmentResponseState } from './enums/assignment-response-state.enum'
import { AssignmentResponseDocument } from './schemas/assignment-response.schema'
import { RepliesType } from './types/reply.type'

@Injectable()
export class AssignmentResponsesService {
    private readonly logger = new Logger(AssignmentResponsesService.name)

    constructor(
        private readonly responsesRepository: AssignmentResponsesRepository,
        private readonly assignmentsRepository: AssignmentsRepository,
        private readonly subscriptionsRepository: SubscriptionsRepository,
        private readonly i18n: I18nService
    ) {}

    async findById(responseId: ObjectId, user: TokenUser): Promise<AssignmentResponseDto> {
        const response = await this.responsesRepository.findById(responseId, true)
        if (!response) {
            throw new NotFoundException(this.i18n.t('assignmentResponses.errors.notFoundBy'))
        }

        if (user.role === Role.Student) {
            this.validateStudentOwnership(response, user.id)
        } else if (user.role === Role.Manager) {
            await this.validateManagerOwnership(response, user.id)
        }

        const hideScores = user.role === Role.Student && response.status !== AssignmentResponseState.published
        return AssignmentResponseMapping.fromDocument(response, hideScores)
    }

    async search(query: SearchAssignmentResponseQueryDto): Promise<PaginatedAssignmentResponseDto> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', query.id)
            .withObjectId('studentId', query.studentId)
            .withObjectId('assignmentId', query.assignmentId)
            .build()

        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.responsesRepository.find(filter, query.pageSize, skip),
            await this.responsesRepository.countDocuments(filter),
        ])
        return PaginationHelper.wrapResponse(AssignmentResponseMapping.fromDocuments(found), query.page, query.pageSize, total)
    }

    async remove(id: ObjectId, userId: ObjectId): Promise<void> {
        const assignmentResponse = await this.responsesRepository.findById(id)
        if (!assignmentResponse) {
            this.logger.error(`AssignmentResponse ${id.toString()} not found`)
            throw new NotFoundException(this.i18n.t('assignmentResponses.errors.notFound'))
        }
        await this.validateManagerOwnership(assignmentResponse, userId)

        const found = await this.responsesRepository.remove({ _id: id })
        if (!found) {
            throw new NotFoundException(this.i18n.t('assignmentResponses.errors.notFound'))
        }
        this.logger.log(`AssignmentResponse ${id.toString()} removed.`)
    }

    async startAssignment(assignmentId: ObjectId, studentId: ObjectId): Promise<StartAssignmentResponseDto> {
        const assignment = await this.assignmentsRepository.findRawById(assignmentId)
        if (!assignment || assignment.state !== AssignmentState.published || !assignment.form) {
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        const now = new Date()
        if (isBefore(now, assignment.availableFrom) || isAfter(now, assignment.availableUntil)) {
            throw new NotAcceptableException(this.i18n.t('assignmentResponses.errors.assignmentNotAvailable'))
        }

        const existingResponse = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (existingResponse) {
            this.logger.warn(`Student ${studentId.toString()} attempting to restart assignment ${assignmentId.toString()}.`)
            return { startedAt: existingResponse.startedAt, ...assignment.form }
        }

        await this.validateStudentSubscription(studentId, assignment.taskId._id)

        const newResponse = await this.responsesRepository.create({
            assignmentId,
            studentId,
        })

        this.logger.log(
            `Student ${studentId.toString()} started assignment ${assignmentId.toString()}. Response ID: ${newResponse._id.toString()}`
        )
        return { startedAt: newResponse.startedAt, ...assignment.form }
    }

    async submitAnswers(assignmentId: ObjectId, studentId: ObjectId, replies: RepliesType): Promise<void> {
        const response = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (!response) {
            throw new NotFoundException(this.i18n.t('assignmentResponses.errors.notStarted'))
        }

        if (
            response.status === AssignmentResponseState.graded ||
            response.status === AssignmentResponseState.published ||
            response.status === AssignmentResponseState.withdrawn
        ) {
            throw new BadRequestException(this.i18n.t('assignmentResponses.errors.alreadySubmittedAndGraded'))
        }

        const assignment = await this.assignmentsRepository.findById(assignmentId)
        if (!assignment || !assignment.form) {
            throw new NotFoundException(this.i18n.t('assignments.errors.assignmentNotFound'))
        }

        // Check if the time limit has been exceeded
        const elapsedTime = (new Date().getTime() - response.startedAt.getTime()) / 60000 // in minutes
        if (elapsedTime > assignment.durationInMinutes) {
            throw new ForbiddenException(this.i18n.t('assignmentResponses.errors.timeLimitExceeded'))
        }

        // Auto-grade (Auto Solving) the submission
        const { individualScores, totalScore } = this.performAutoGrading(assignment, replies)

        await this.responsesRepository.update(
            { _id: response._id },
            {
                submittedAt: new Date(),
                status: AssignmentResponseState.submitted,
                replies: replies,
                individualScores,
                score: totalScore,
            }
        )
        this.logger.log(
            `Student ${studentId.toString()} submitted assignment ${assignmentId.toString()}. Auto-score: ${totalScore}.`
        )
    }

    async grade(responseId: ObjectId, managerId: ObjectId, dto: ManualGradeDto): Promise<void> {
        const response = await this.findAndValidateManagerOwnership(responseId, managerId)

        // override auto-graded scores with scores set by manager
        for (const questionId in dto.scores) {
            response.individualScores.questionId = dto.scores[questionId]
        }
        response.score = Object.values(response.individualScores).reduce((sum, score) => sum + score, 0)
        response.notes = dto.notes
        response.status = AssignmentResponseState.graded
        await response.updateOne()

        this.logger.log(`Manager ${managerId.toString()} graded response ${responseId.toString()}. New score: ${response.score}.`)
    }

    private performAutoGrading(
        assignment: AssignmentDocument,
        replies: RepliesType
    ): { individualScores: Record<string, number>; totalScore: number } {
        const questionMap = new Map<string, Question>()

        if (!AssignmentFormValidator.isFormStructureValid(assignment.form)) {
            this.logger.error(
                `Invalid form structure for assignment ${assignment._id.toString()}: ${JSON.stringify(assignment.form)}`
            )
            throw new ConflictException(this.i18n.t('assignmentResponses.errors.invalidFormStructure'))
        }

        for (const element of assignment.form.slides?.flatMap(s => s.elements) ?? []) {
            if (element.question && element.id) {
                questionMap.set(element.id, element)
            }
        }

        const individualScores: Record<string, number> = {}
        let totalScore = 0

        for (const [questionId, question] of questionMap.entries()) {
            if (!this.validateQuestion(question)) {
                this.logger.error(`Invalid question format for question ${questionId}: ${JSON.stringify(question)}`)
                continue
            }
            const studentAnswer = replies[questionId]
            let isCorrect = false

            if (!studentAnswer) {
                isCorrect = false
            } else {
                const answer = question.answer
                switch (question.type) {
                    case 'number':
                    case 'select':
                        isCorrect = studentAnswer.toLowerCase() === answer?.toString().toLowerCase()
                        break
                    case 'choice':
                        if (question.multiple) {
                            // Compare two arrays, ignoring order
                            isCorrect = [...studentAnswer].sort().join(',') === [...(answer ?? [])].sort().join(',')
                        } else {
                            isCorrect = studentAnswer === answer?.[0]
                        }
                        break
                    default:
                        this.logger.error(`Unsupported question type: ${JSON.stringify(question)}`)
                        isCorrect = false
                }
            }

            const score = isCorrect ? (question.score ?? 0) : 0
            individualScores[questionId] = score
            totalScore += score
        }

        return { individualScores, totalScore }
    }

    private async validateStudentSubscription(studentId: ObjectId, taskId: ObjectId): Promise<void> {
        const subscriptions = await this.subscriptionsRepository.find({ subscriber: studentId, state: SubscriptionState.active })
        const taskIdsForStudent = subscriptions.flatMap(sub =>
            (sub.program as ProgramDocument).levels.flatMap(level => (level as LevelDocument).tasks.map(task => task._id))
        )
        if (taskId && !taskIdsForStudent.some(taskId => taskId.equals(taskId))) {
            throw new ForbiddenException(this.i18n.t('assignments.errors.taskNotOwnedByStudent'))
        }
    }

    private async findAndValidateManagerOwnership(
        responseId: ObjectId,
        managerId: ObjectId
    ): Promise<AssignmentResponseDocument> {
        const response = await this.responsesRepository.findById(responseId)
        if (!response) {
            throw new NotFoundException(this.i18n.t('assignmentResponses.errors.notFound'))
        }

        const assignment = await this.assignmentsRepository.findRawById(response.assignment._id)
        if (assignment?.createdBy._id.equals(managerId)) {
            throw new ForbiddenException(this.i18n.t('assignments.errors.managerNotAuthorized'))
        }
        return response
    }

    private validateQuestion(question: Question): question is Question {
        if (!question) {
            return false
        }
        const type = question.type
        if (!type) {
            return false
        }
        if (type === 'select' || type === 'number') {
            return 'answer' in question
        }
        if (type === 'choice') {
            return 'answer' in question && Array.isArray(question.answer)
        }
        return false
    }

    private validateStudentOwnership(assignmentResponse: AssignmentResponseDocument, userId: ObjectId): void {
        if (!assignmentResponse.student._id.equals(userId)) {
            this.logger.error(
                `Permission Denied: User ${userId.toString()} trying to access assignmentResponse ${assignmentResponse._id.toString()}`
            )
            throw new ForbiddenException(this.i18n.t('assignments.errors.studentNotAuthorized'))
        }
    }

    /**
     * Validates that the provided user is the owner of the assignment related to the given response.
     */
    private async validateManagerOwnership(assignmentResponse: AssignmentResponseDocument, userId: ObjectId): Promise<void> {
        const assignment = await this.assignmentsRepository.findById(assignmentResponse.assignment as ObjectId)

        if (!assignment?.createdBy._id.equals(userId)) {
            this.logger.error(
                `Permission Denied: User ${userId.toString()} trying to access assignmentResponse ${assignmentResponse._id.toString()}`
            )
            throw new ForbiddenException(this.i18n.t('assignments.errors.managerNotAuthorized'))
        }
    }
}
