import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
    ApiNotAcceptableResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { GetUser } from '../../shared/decorators/get-user.decorator'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ParseMongoIdPipe } from '../../shared/pipes/ParseMongoIdPipe'
import { ObjectId } from '../../shared/repository/types'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { AssignmentResponsesService } from './assignment-responses.service'
import {
    AssignmentResponseDto,
    PaginatedAssignmentResponseDto,
    SearchAssignmentResponseQueryDto,
} from './dto/assignment-response.dto'
import { ManualGradeDto } from './dto/manual-grade.dto'
import { StartAssignmentResponseDto } from './dto/start-assignment.response.dto'
import { RepliesType } from './types/reply.type'

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assignment-responses')
export class AssignmentResponsesController {
    constructor(private readonly assignmentResponsesService: AssignmentResponsesService) {}

    @ApiOperation({
        summary: '[Student] Starts an assignment',
        description: 'Creates a new assignment response record for the logged-in student.',
    })
    @ApiOkResponse({ type: StartAssignmentResponseDto })
    @ApiForbiddenResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @ApiNotAcceptableResponse({ type: ErrorDto })
    @ApiBadRequestResponse({ type: BadRequestErrorDto })
    @ApiParam({ name: 'assignmentId', type: String, required: true })
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Student)
    @Post(':assignmentId/start')
    startAssignment(
        @Param('assignmentId', ParseMongoIdPipe) assignmentId: ObjectId,
        @GetUser() user: TokenUser
    ): Promise<StartAssignmentResponseDto> {
        return this.assignmentResponsesService.startAssignment(assignmentId, user.id)
    }

    @ApiOperation({ summary: '[Student] Submits answers for an assignment they have started' })
    @ApiCreatedResponse({ description: 'Answers submitted successfully.' })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @ApiForbiddenResponse({ type: ErrorDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @ApiConflictResponse({ type: ErrorDto, description: 'Invalid form structure for this assignment.' })
    @ApiBadRequestResponse({ type: BadRequestErrorDto })
    @ApiBody({
        description: "A JSON object where keys are question IDs and values are the student's answers.",
        type: Object,
        examples: {
            a: {
                summary: 'Example Submission',
                value: {
                    '7a8649ab-90c0-49b9-8cbb-c771fdaa1ee7': 5,
                    '594a9970-9a61-4871-94c5-6104c817404f': 'yes',
                },
            },
        },
    })
    @ApiParam({ name: 'assignmentId', type: String, required: true })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Student)
    @Patch(':assignmentId/submit')
    submitAnswers(
        @Param('assignmentId', ParseMongoIdPipe) assignmentId: ObjectId,
        @GetUser() user: TokenUser,
        @Body() replies: RepliesType
    ): Promise<void> {
        return this.assignmentResponsesService.submitAnswers(assignmentId, user.id, replies)
    }

    @ApiOperation({ summary: '[Manager] Manually grades/overrides scores for a response' })
    @ApiNoContentResponse({ description: 'Response graded successfully.' })
    @ApiNotFoundResponse({ type: ErrorDto })
    @ApiForbiddenResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @ApiBadRequestResponse({ type: BadRequestErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @Patch(':id/grade')
    gradeManual(
        @Param('id', ParseMongoIdPipe) responseId: ObjectId,
        @GetUser() user: TokenUser,
        @Body() gradeManualDto: ManualGradeDto
    ): Promise<void> {
        return this.assignmentResponsesService.grade(responseId, user.id, gradeManualDto)
    }

    @ApiOperation({ summary: '[Manager] Searches for assignment responses', description: 'Searches for assignment responses' })
    @ApiOkResponse({ type: PaginatedAssignmentResponseDto, description: 'Got assignment responses successfully.' })
    @ApiInternalServerErrorResponse({ type: ErrorDto })
    @ApiForbiddenResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    index(@Query() searchAssignmentResponseQueryDto: SearchAssignmentResponseQueryDto): Promise<PaginatedAssignmentResponseDto> {
        return this.assignmentResponsesService.search(searchAssignmentResponseQueryDto)
    }

    @ApiOperation({ summary: '[Student/Manager] Get a single assignment response by ID' })
    @ApiOkResponse({ type: AssignmentResponseDto })
    @ApiNotFoundResponse({ type: ErrorDto })
    @ApiUnauthorizedResponse({ type: ErrorDto })
    @ApiForbiddenResponse({ type: ErrorDto })
    @ApiBadRequestResponse({ type: BadRequestErrorDto })
    @ApiParam({ name: 'id', type: String, required: true })
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager, Role.Student)
    @Get(':id')
    show(@Param('id', ParseMongoIdPipe) responseId: ObjectId, @GetUser() user: TokenUser): Promise<AssignmentResponseDto> {
        return this.assignmentResponsesService.findById(responseId, user)
    }

    @ApiOperation({
        summary: '[Manager] Removes a assignment response',
        description: 'Removes a assignment response from the manager.',
    })
    @ApiNoContentResponse({ description: 'Assignment Response successfully removed.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.', type: ErrorDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized user', type: ErrorDto })
    @ApiForbiddenResponse({ description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiNotFoundResponse({ description: 'Assignment Response not found.', type: ErrorDto })
    @ApiBadRequestResponse({ description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiParam({ name: 'id', type: String, required: true })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @Delete(':id')
    remove(@GetUser() user: TokenUser, @Param('id', ParseMongoIdPipe) assignmentResponseId: ObjectId): Promise<void> {
        return this.assignmentResponsesService.remove(assignmentResponseId, user.id)
    }
}
