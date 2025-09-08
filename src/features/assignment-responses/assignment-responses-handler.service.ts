import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentsRepository } from '../assignments/assignments.repository'
import { AssignmentState } from '../assignments/enums/assignment-state.enum'
import { FormElementDocument } from '../assignments/schemas/assignment-form.schema'
import { AssignmentDocument } from '../assignments/schemas/assignment.model'
import { ProgramsRepository } from '../programs/programs.repository'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { GradeManualDto } from './dto/grade-manual.dto'
import { RepliesPlainDto } from './dto/submit-answers.dto'
import { AssignmentResponseStatus } from './enums/assignment-response-status.enum'
import { AssignmentResponseDocument } from './schemas/assignment-response.schema'

@Injectable()
export class AssignmentResponsesHandlerService {
    private readonly logger = new Logger(AssignmentResponsesHandlerService.name)

    constructor(
        private readonly responsesRepository: AssignmentResponsesRepository,
        private readonly assignmentsRepository: AssignmentsRepository,
        private readonly subscriptionsRepository: SubscriptionsRepository,
        private readonly programsRepository: ProgramsRepository
    ) {}

    async startAssignment(assignmentId: string, studentId: string): Promise<any> {
        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))
        if (!assignment || assignment.state !== AssignmentState.published) {
            throw new NotFoundException('Assignment not found.')
        }

        const now = new Date()
        if (now < assignment.availableFrom || now > assignment.availableUntil) {
            throw new ForbiddenException('Assignment is not currently available.')
        }

        const existingResponse = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (existingResponse) {
            this.logger.warn(`Student ${studentId} attempting to restart assignment ${assignmentId}.`)
            // return { id: existingResponse._id.toString() };
            return { startedAt: existingResponse.startedAt, ...assignment.form }
        }

        // TODO: FIX AUTHORiZation
        // Authorization: Check student's subscription
        // await this.validateStudentSubscription(studentId, assignment.levelId.toString());

        const newResponse = await this.responsesRepository.create({
            assignmentId,
            studentId,
            startedAt: new Date(),
            status: AssignmentResponseStatus.IN_PROGRESS,
        })

        this.logger.log(`Student ${studentId} started assignment ${assignmentId}. Response ID: ${newResponse.id}`)
        // return { id: newResponse._id.toString() };
        return { startedAt: newResponse.startedAt, ...assignment.form }
    }

    async submitAnswers(assignmentId: string, studentId: string, replies: RepliesPlainDto): Promise<void> {
        const response = await this.responsesRepository.findOne({ assignmentId, studentId })
        if (!response) {
            throw new NotFoundException('You have not started this assignment. Please start the assignment before submitting.')
        }

        if (response.status === AssignmentResponseStatus.GRADED) {
            throw new BadRequestException('Assignment has already been submitted and graded.')
        }

        // if (response.status !== AssignmentResponseStatus.IN_PROGRESS) {
        //     throw new BadRequestException('Assignment has already been submitted or graded.');
        // }

        // if (response.submittedAt) {
        //     throw new BadRequestException('This assignment has already been submitted.');
        // }

        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))
        if (!assignment) {
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
                status: AssignmentResponseStatus.SUBMITTED,
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
                status: AssignmentResponseStatus.GRADED,
            }
        )
        this.logger.log(`Manager ${managerId} graded response ${responseId}. New score: ${newTotalScore}.`)
    }

    private performAutoGrading(
        assignment: AssignmentDocument,
        replies: RepliesPlainDto
    ): { individualScores: Record<string, number>; totalScore: number } {
        const questionMap = new Map<string, FormElementDocument>()

        assignment.form.slides
            .flatMap(s => s.elements)
            .filter(el => el.question) // Only consider elements that are questions
            .forEach(el => questionMap.set(el._id.toString(), el))

        const individualScores: Record<string, number> = {}
        let totalScore = 0

        for (const [questionId, question] of questionMap.entries()) {
            const studentAnswer = replies[questionId]
            let isCorrect = false

            if (studentAnswer === undefined || studentAnswer === null) {
                isCorrect = false
            } else {
                switch (question.type) {
                    case 'number':
                    case 'select':
                        isCorrect = studentAnswer.toString().toLowerCase() === question.answer?.toString().toLowerCase()
                        break
                    case 'choice':
                        if (question.multiple) {
                            // Compare two arrays, ignoring order
                            isCorrect = isEqual([...studentAnswer].sort(), [...question.answer].sort())
                        } else {
                            isCorrect = studentAnswer === question.answer?.[0]
                        }
                        break
                    default:
                        isCorrect = false
                }
            }

            const score = isCorrect ? question.score || 0 : 0
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
}
