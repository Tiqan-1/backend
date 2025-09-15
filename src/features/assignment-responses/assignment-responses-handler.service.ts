import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotAcceptableException,
    NotFoundException,
} from '@nestjs/common'
import { isAfter, isBefore } from 'date-fns'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentFormValidator } from '../assignments/assignment-form.validator'
import { AssignmentsRepository } from '../assignments/assignments.repository'
import { AssignmentState } from '../assignments/enums/assignment-state.enum'
import { AssignmentDocument } from '../assignments/schemas/assignment.schema'
import { ProgramsRepository } from '../programs/programs.repository'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { GradeManualDto } from './dto/grade-manual.dto'
import { StartAssignmentResponseDto } from './dto/start-assignment.response.dto'
import { RepliesPlainDto } from './dto/submit-answers.dto'
import { AssignmentResponseStatus } from './enums/assignment-response-status.enum'
import { AssignmentResponseDocument } from './schemas/assignment-response.schema'

type BaseQuestion = { score?: number }
type SelectionQuestion = { type: 'select'; answer?: string }
type NumberQuestion = { type: 'number'; answer?: string }
type ChoiceQuestion = { type: 'choice'; multiple?: boolean; answer?: string[] }
type Question = BaseQuestion & (SelectionQuestion | NumberQuestion | ChoiceQuestion)

@Injectable()
export class AssignmentResponsesHandlerService {
    private readonly logger = new Logger(AssignmentResponsesHandlerService.name)

    constructor(
        private readonly responsesRepository: AssignmentResponsesRepository,
        private readonly assignmentsRepository: AssignmentsRepository,
        private readonly subscriptionsRepository: SubscriptionsRepository,
        private readonly programsRepository: ProgramsRepository
    ) {}

    async startAssignment(assignmentId: ObjectId, studentId: ObjectId): Promise<StartAssignmentResponseDto> {
        const assignment = await this.assignmentsRepository.findRawById(assignmentId)
        if (!assignment || assignment.state !== AssignmentState.published || !assignment.form) {
            throw new NotFoundException('Assignment not found.')
        }

        const now = new Date()
        if (isBefore(now, assignment.availableFrom) || isAfter(now, assignment.availableUntil)) {
            throw new NotAcceptableException('Assignment is not currently available.')
        }

        const existingResponse = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (existingResponse) {
            this.logger.warn(`Student ${studentId.toString()} attempting to restart assignment ${assignmentId.toString()}.`)
            return { startedAt: existingResponse.startedAt, ...assignment.form }
        }

        // TODO: FIX AUTHORiZation
        // Authorization: Check student's subscription
        // await this.validateStudentSubscription(studentId, assignment.levelId.toString());

        const newResponse = await this.responsesRepository.create({
            assignmentId,
            studentId,
        })

        this.logger.log(
            `Student ${studentId.toString()} started assignment ${assignmentId.toString()}. Response ID: ${newResponse._id.toString()}`
        )
        return { startedAt: newResponse.startedAt, ...assignment.form }
    }

    async submitAnswers(assignmentId: string, studentId: string, replies: RepliesPlainDto): Promise<void> {
        const response = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (!response) {
            throw new NotFoundException('You have not started this assignment. Please start the assignment before submitting.')
        }

        if (response.status === AssignmentResponseStatus.graded) {
            throw new BadRequestException('Assignment has already been submitted and graded.')
        }

        // if (response.status !== AssignmentResponseStatus.IN_PROGRESS) {
        //     throw new BadRequestException('Assignment has already been submitted or graded.');
        // }

        // if (response.submittedAt) {
        //     throw new BadRequestException('This assignment has already been submitted.');
        // }

        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))
        if (!assignment || !assignment.form) {
            throw new NotFoundException('Associated assignment not found.')
        }

        // Check if time limit has been exceeded
        const elapsedTime = (new Date().getTime() - response.startedAt.getTime()) / 60000 // in minutes
        if (elapsedTime > assignment.durationInMinutes) {
            throw new ForbiddenException('The time limit for this assignment has passed.')
        }

        // Auto-grade (Auto Solving) the submission
        const { individualScores, totalScore } = this.performAutoGrading(assignment, replies)

        await this.responsesRepository.update(
            { _id: response._id },
            {
                submittedAt: new Date(),
                status: AssignmentResponseStatus.submitted,
                replies: replies,
                individualScores,
                score: totalScore,
            }
        )
        this.logger.log(`Student ${studentId} submitted assignment ${assignmentId}. Auto-score: ${totalScore}.`)
    }

    async grade(responseId: string, managerId: string, dto: GradeManualDto): Promise<void> {
        const response = await this.findAndValidateManagerOwnership(responseId, managerId)

        // console.log(response.individualScores)
        // console.log('☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺')

        // Merge manager's scores with existing auto-graded scores
        const updatedScores = new Map(response.individualScores.entries())
        // console.log(updatedScores)
        // console.log('☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺')
        for (const questionId in dto.scores) {
            updatedScores.set(questionId, dto.scores[questionId])
        }
        // console.log(updatedScores)
        // console.log('☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺')

        const newTotalScore = Array.from(updatedScores.values()).reduce((sum, score) => sum + score, 0)

        // console.warn(newTotalScore)
        // console.log('☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺☺')
        console.warn(Object.fromEntries(updatedScores))
        await this.responsesRepository.update(
            { _id: responseId },
            {
                individualScores: Object.fromEntries(updatedScores),
                score: newTotalScore,
                notes: dto.notes,
                status: AssignmentResponseStatus.graded,
            }
        )
        this.logger.log(`Manager ${managerId} graded response ${responseId}. New score: ${newTotalScore}.`)
    }

    private performAutoGrading(
        assignment: AssignmentDocument,
        replies: RepliesPlainDto
    ): { individualScores: Record<string, number>; totalScore: number } {
        const questionMap = new Map<string, unknown>()

        if (!AssignmentFormValidator.isFormStructureValid(assignment.form)) {
            this.logger.error(
                `Invalid form structure for assignment ${assignment._id.toString()}: ${JSON.stringify(assignment.form)}`
            )
            throw new ConflictException('Invalid form structure.')
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

    private async validateStudentSubscription(studentId: string, targetLevelId: string): Promise<void> {
        const activeSubs = await this.subscriptionsRepository.find({
            subscriber: studentId,
            state: SubscriptionState.active,
        })

        if (activeSubs.length === 0) {
            throw new ForbiddenException('You do not have any active subscriptions.')
        }

        const programIds = activeSubs.map(sub => sub.program._id.toString())
        const programs = await this.programsRepository.find({ _id: { $in: programIds } })

        const accessibleLevelIds = new Set<string>()
        programs.forEach(program => {
            program.levels.forEach(levelId => accessibleLevelIds.add(levelId._id.toString()))
        })

        if (!accessibleLevelIds.has(targetLevelId)) {
            this.logger.warn(`Access denied for student ${studentId} to level ${targetLevelId}.`)
            throw new ForbiddenException('You are not subscribed to the program containing this assignment.')
        }
    }

    private async findAndValidateManagerOwnership(responseId: string, managerId: string): Promise<AssignmentResponseDocument> {
        const response = await this.responsesRepository.findOneById(responseId, { path: 'assignmentId' })
        if (!response) throw new NotFoundException('Assignment response not found.')

        const assignment = response.assignmentId as AssignmentDocument
        if (assignment.createdBy._id.toString() !== managerId) {
            throw new ForbiddenException('You are not authorized to grade this response.')
        }
        return response
    }

    private validateQuestion(question: unknown): question is Question {
        if (!question || typeof question !== 'object' || !('type' in question)) {
            return false
        }
        const type = question.type as string
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
}
