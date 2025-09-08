import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { PaginatedAssignmentResponseDto } from './dto/paginated.dto'

import { TokenUser } from '../authentication/types/token-user'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { AssignmentResponseDto, SearchAssignmentResponseQueryDto } from './dto/assignment-response.dto'
import { AssignmentResponseMapping } from './dto/mapping'
import { AssignmentResponseDocument } from './schemas/assignment-response.schema'

@Injectable()
export class AssignmentResponsesService {
    private readonly logger = new Logger(AssignmentResponsesService.name)

    constructor(private readonly assignmentEesponsesRepository: AssignmentResponsesRepository) {}

    private async checkOwnership(assignmentResponseId: string, user: TokenUser): Promise<AssignmentResponseDocument> {
        const assignmentResponse = await this.assignmentEesponsesRepository.findById(new ObjectId(assignmentResponseId))

        if (!assignmentResponse) {
            this.logger.error(`AssignmentResponse ${assignmentResponseId} not found`)
            throw new NotFoundException('Assignment Response not found.')
        }

        const createdById = assignmentResponse.studentId._id.toString()

        if (createdById !== user.id.toString()) {
            this.logger.error(
                `Permission Denied: User ${user.id.toString()} trying to access assignmentResponse ${assignmentResponseId}`
            )
            throw new ForbiddenException('Permission Denied.')
        }

        return assignmentResponse
    }

    async findOneById(responseId: string, user: TokenUser): Promise<AssignmentResponseDto> {
        const response = await this.assignmentEesponsesRepository.findOneById(
            responseId,
            {
                path: 'assignmentId',
                populate: {
                    path: 'createdBy',
                    select: 'name email',
                },
            },
            {
                path: 'studentId',
                select: 'name email',
            }
        )
        if (!response) {
            throw new NotFoundException(`Assignment response with ID "${responseId}" not found.`)
        }

        // TODO: CLEAN THIS

        // // --- Role-based Authorization ---
        // if (user.role === Role.Student) {
        //     // A student can only see their own response
        //     if (response.studentId._id.toString() !== user.id._id.toString()) {
        //         throw new ForbiddenException('You are not authorized to view this response.');
        //     }
        // } else if (user.role === Role.Manager) {
        //     // A manager can only see responses for assignments they created
        //     // We need to cast the populated field to access its properties
        //     const assignment = response.assignmentId as any;
        //     if (assignment.createdBy._id.toString() !== user.id) {
        //         throw new ForbiddenException('You are not authorized to view this response.');
        //     }
        // } else {
        //     // Fallback for any other roles
        //     throw new ForbiddenException();
        // }

        // // Map to DTO
        const responseDto = AssignmentResponseMapping.fromDocument(response)

        // // --- Data Hiding for Students ---
        // // If the user is a student and the grades are not published, hide the scores.
        // if (user.role === Role.Student && response.status !== AssignmentResponseStatus.PUBLISHED) {
        //     responseDto.score = undefined;
        //     responseDto.individualScores = undefined;
        //     responseDto.notes = undefined;
        // }

        return responseDto
    }

    //
    //
    //
    //
    // === SEARCH ASSIGNMENT RESPONSES ===
    //
    //
    //
    //
    async search(query: SearchAssignmentResponseQueryDto): Promise<PaginatedAssignmentResponseDto> {
        const filter = SearchFilterBuilder.init()
            .withParam('_id', query.id)
            .withParam('studentId', query.studentId)
            .withParam('assignmentId', query.assignmentId)
            .build()

        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.assignmentEesponsesRepository.find(filter, query.pageSize, skip),
            await this.assignmentEesponsesRepository.countDocuments(filter),
        ])
        return PaginationHelper.wrapResponse(AssignmentResponseMapping.fromDocuments(found), query.page, query.pageSize, total)
    }

    // //
    // //
    // //
    // //
    // // === UPDATE AN ASSIGNMENTRESPONSE ===
    // //
    // //
    // //
    // //
    // async update(id: string, updateAssignmentResponseDto: UpdateAssignmentResponseDto, user: TokenUser): Promise<void> {
    //     await this.checkOwnership(id, user);

    //     const assignmentresponseId = new ObjectId(id)
    //     const updateObject = UpdateAssignmentResponseDto.toDocument(updateAssignmentResponseDto)
    //     const updated = await this.assignmentEesponsesRepository.update({ _id: assignmentresponseId }, updateObject)
    //     if (!updated) {
    //         this.logger.error(`Attempt to update assignmentresponse ${id} failed.`)
    //         throw new NotFoundException('AssignmentResponse not found.')
    //     }
    // }

    //
    //
    //
    //
    // === DELETE AN ASSIGNMENT ASSIGNMENTRESPONSE ===
    //
    //
    //
    //
    async remove(id: string, user: TokenUser): Promise<void> {
        await this.checkOwnership(id, user)

        const found = await this.assignmentEesponsesRepository.remove(
            { _id: new ObjectId(id) }
            // { expireAt: oneMonth }
        )
        if (!found) {
            this.logger.error(`Attempt to remove assignmentresponse ${id} failed.`)
            throw new NotFoundException('AssignmentResponse not found.')
        }
        this.logger.log(`AssignmentResponse ${id} removed.`)
    }
}
