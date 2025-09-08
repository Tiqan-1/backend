import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { now } from 'mongoose'
import { oneMonth } from '../../shared/constants'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentResponsesRepository } from '../assignment-responses/assignment-responses.repository'
import { AssignmentResponseStatus } from '../assignment-responses/enums/assignment-response-status.enum'
import { LevelDocument } from '../levels/schemas/level.schema'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { SubjectDocument } from '../subjects/schemas/subject.schema'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { AssignmentsRepository } from './assignments.repository'
import {
    AssignmentDto,
    CreateAssignmentDto,
    PaginatedAssignmentDto,
    SearchAssignmentQueryDto,
    SearchStudentAssignmentQueryDto,
    UpdateAssignmentDto,
} from './dto/assignment.dto'
import { AssignmentMapping } from './dto/mapping'
import { PaginatedAssignmentStudentDto, StudentAssignmentDto } from './dto/student-assignment.dto'
import { AssignmentGradingState } from './enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from './enums/assignment-state.enum'
import { AssignmentDocument } from './schemas/assignment.model'

@Injectable()
export class AssignmentsService {
    private readonly logger = new Logger(AssignmentsService.name)

    constructor(
        private readonly assignmentsRepository: AssignmentsRepository,
        @Inject(forwardRef(() => AssignmentResponsesRepository))
        private readonly responsesRepository: AssignmentResponsesRepository,
        private readonly subscriptionsRepository: SubscriptionsRepository
    ) {}

    private async checkOwnership(
        assignmentId: string,
        managerId: string,
        updateDto: UpdateAssignmentDto | undefined
    ): Promise<AssignmentDocument> {
        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))

        if (!assignment) {
            this.logger.error(`Assignment ${assignmentId} not found`)
            throw new NotFoundException('Assignment not found.')
        }

        const createdById = assignment.createdBy._id.toString()

        if (createdById !== managerId) {
            this.logger.error(`Permission Denied: Manager ${managerId} trying to access assignment ${assignmentId}`)
            throw new ForbiddenException('Permission Denied.')
        }

        if (assignment.state == AssignmentState.published && updateDto?.form != undefined) {
            this.logger.error(`Permission Denied: Manager ${managerId} trying to editing a published assignment ${assignmentId}`)
            throw new ForbiddenException('Permission Denied (editing a published assignment).')
        }
        if (assignment.state == AssignmentState.closed && updateDto?.form != undefined) {
            this.logger.error(`Permission Denied: Manager ${managerId} trying to editing a closed assignment ${assignmentId}`)
            throw new ForbiddenException('Permission Denied (editing a closed assignment).')
        }

        return assignment
    }

    async publishGrades(assignmentId: string, managerId: string): Promise<void> {
        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))

        // Authorization
        if (!assignment) throw new NotFoundException('Assignment not found.')
        if (assignment.createdBy._id.toString() !== managerId) {
            throw new ForbiddenException('You are not the creator of this assignment.')
        }
        if (assignment.gradingState === AssignmentGradingState.published) {
            throw new BadRequestException('Grades for this assignment have already been published.')
        }

        // Fetch all responses for this assignment
        const responses = await this.responsesRepository.find({ assignmentId })

        if (responses.length === 0) {
            this.logger.warn(
                `Manager ${managerId} attempt to publish grades for assignment ${assignmentId} which has no submissions.`
            )
            // await this.assignmentsRepository.update({ _id: assignmentId }, { gradingState: AssignmentGradingState.PUBLISHED });
            throw new BadRequestException('No grades for this assignment.')
        }

        // Validation: Ensure all are graded
        const allGraded = responses.every(r => r.status === AssignmentResponseStatus.GRADED)
        if (!allGraded) {
            throw new BadRequestException(
                'Cannot publish grades. One or more student submissions have not been marked as "Graded".'
            )
        }

        // Perform Bulk Update on responses
        await this.responsesRepository.updateMany(
            { assignmentId: assignmentId, status: AssignmentResponseStatus.GRADED },
            { $set: { status: AssignmentResponseStatus.PUBLISHED } }
        )

        // Update the Assignment's state
        await this.assignmentsRepository.update({ _id: assignmentId }, { gradingState: AssignmentGradingState.published })

        this.logger.log(`Manager ${managerId} published grades for assignment ${assignmentId}.`)
    }

    async create(createAssignmentDto: CreateAssignmentDto, createdBy: ObjectId): Promise<CreatedDto> {
        const managerId = createdBy.toString()
        const document = CreateAssignmentDto.toDocument(createAssignmentDto, createdBy)
        const data = { ...document, createdAt: now(), updatedAt: now() }
        console.log('create Assignment data')
        console.log(data)
        const created = await this.assignmentsRepository.create(data)
        this.logger.log(`Assignment ${created.id} created by ${managerId}.`)
        return { id: created._id.toString() }
    }

    async showForManager(assignmentId: string, managerId: string): Promise<AssignmentDto> {
        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))

        if (!assignment) {
            throw new NotFoundException(`Assignment with ID "${assignmentId}" not found.`)
        }

        if (assignment.createdBy._id.toString() !== managerId) {
            console.log(assignment.createdBy._id.toString())
            console.log(managerId)
            throw new ForbiddenException('You are not authorized to view this assignment.')
        }

        return AssignmentMapping.fromDocument(assignment)
    }

    async showForStudent(assignmentId: string, studentId: string): Promise<AssignmentDto> {
        const assignment = await this.assignmentsRepository.findById(new ObjectId(assignmentId))

        if (!assignment) {
            throw new NotFoundException(`Assignment with ID "${assignmentId}" not found.`)
        }

        // TODO authorization

        // TODO Omit answers from assignment.form
        return AssignmentMapping.fromDocument(assignment, true)
    }

    async search(
        query: SearchAssignmentQueryDto | SearchStudentAssignmentQueryDto,
        createdById?: ObjectId
    ): Promise<PaginatedAssignmentDto> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', query.id)
            .withObjectId('createdBy', createdById)
            .withObjectId('levelId', query.levelId)
            .withObjectId('subjectId', query.subjectId)
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
        return PaginationHelper.wrapResponse(AssignmentMapping.fromDocuments(found), query.page, query.pageSize, total)
    }

    async update(id: string, updateAssignmentDto: UpdateAssignmentDto, managerObjectId: ObjectId): Promise<void> {
        await this.checkOwnership(id, managerObjectId.toString(), updateAssignmentDto)

        const assignmentId = new ObjectId(id)
        const updateObject = UpdateAssignmentDto.toDocument(updateAssignmentDto)
        const updated = await this.assignmentsRepository.update({ _id: assignmentId }, updateObject)
        if (!updated) {
            this.logger.error(`Attempt to update assignment ${id} failed.`)
            throw new NotFoundException('Assignment not found.')
        }
    }

    async remove(id: string, managerObjectId: ObjectId): Promise<void> {
        await this.checkOwnership(id, managerObjectId.toString(), undefined)

        const found = await this.assignmentsRepository.update(
            { _id: new ObjectId(id) },
            { state: AssignmentState.deleted, expireAt: oneMonth }
        )
        if (!found) {
            this.logger.error(`Attempt to remove assignment ${id} failed.`)
            throw new NotFoundException('Assignment not found.')
        }

        // for (const level of found.responses) {
        //     try {
        //         await this.levelsService.remove(level._id.toString())
        //     } catch (error) {
        //         this.logger.error(`Attempt to remove level ${level._id.toString()} from assignment ${id} failed.`, error)
        //     }
        // }
        this.logger.log(`Assignment ${id} removed.`)
    }

    async findAvailableForStudent(studentId: string): Promise<PaginatedAssignmentStudentDto> {
        // Find all accessible level IDs for the student
        const accessibleLevelIds = await this.getAccessibleLevelIds(studentId)
        // console.log(" ☺ ☺ ☺ accessibleLevelIds ☺ ☺ ☺")
        // console.log(accessibleLevelIds)

        if (accessibleLevelIds.length === 0) {
            // No active subscriptions, so no available assignments
            return PaginationHelper.wrapResponse([], 1, 100, 0)
        }

        // Find all published assignments for those levels that are currently active
        const filter = SearchFilterBuilder.init()
            .withObjectIds('levelId', accessibleLevelIds)
            .withParam('state', AssignmentState.published)
            .withParam('type', AssignmentType.exam)
            .build()

        const skip = PaginationHelper.calculateSkip(1, 100)

        const [found, total] = await Promise.all([
            await this.assignmentsRepository.find(filter, 100, skip),
            await this.assignmentsRepository.countDocuments(filter),
        ])
        // console.log(" ☺ ☺ ☺ found ☺ ☺ ☺")
        // console.log(found)
        return PaginationHelper.wrapResponse(
            found.map(assignment => this.mapToStudentAssignmentDto(assignment)),
            1,
            100,
            total
        )
    }

    private async getAccessibleLevelIds(studentId: string): Promise<string[]> {
        // console.log(" ☺ ☺ ☺ studentId ☺ ☺ ☺")
        // console.log(studentId)
        const activeSubs = await this.subscriptionsRepository.find({
            subscriber: studentId,
            state: SubscriptionState.active,
        })

        // console.log(" ☺ ☺ ☺ activeSubs ☺ ☺ ☺")
        // console.log(activeSubs)
        if (activeSubs.length === 0) {
            return []
        }
        return activeSubs
            .map(sub => sub.program)
            .flatMap(program => (program as ProgramDocument).levels.map(level => level._id.toString()))

        // const programIds = activeSubs.map(sub => sub.program.toString());
        // const programs = await this.programsRepository.find({ _id: { $in: programIds } });

        // console.log(" ☺ ☺ ☺ programs ☺ ☺ ☺")
        // console.log(programs)
        // const levelIds = new Set<string>();
        // programs.forEach(program => {
        //     program.levels.forEach(levelId => levelIds.add(levelId.toString()));
        // });

        // return Array.from(levelIds);
    }

    private mapToStudentAssignmentDto(assignment: AssignmentDocument): StudentAssignmentDto {
        // Helper to strip sensitive data from a form element
        // const stripAnswer = (element: FormElement): StudentFormElementDto => ({
        //     id: element.id,
        //     type: element.type,
        //     question: element.question,
        //     choices: element.choices,
        //     options: element.options,
        //     multiple: element.multiple,
        //     text: element.text,
        // });

        return {
            id: assignment._id.toString(),
            title: assignment.title,
            type: assignment.type,
            durationInMinutes: assignment.durationInMinutes,
            availableFrom: assignment.availableFrom,
            availableUntil: assignment.availableUntil,
            subjectName: (assignment.subjectId as SubjectDocument)?.name || 'N/A',
            levelName: (assignment.levelId as LevelDocument)?.name || 'N/A',

            // Uncomment the 'form' part if you want to include assignment questions
            /*
            form: {
                slides: assignment.form.slides.map(slide => ({
                    elements: slide.elements
                        .filter(el => el.question) // Only include actual question elements
                        .map(stripAnswer)
                }))
            }
            */
        }
    }
}
