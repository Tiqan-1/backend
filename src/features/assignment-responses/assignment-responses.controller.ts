import {
    Body,
    Controller,
    createParamDecorator,
    Delete,
    ExecutionContext,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AssignmentForm } from '../assignments/schemas/assignment-form.schema'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { AssignmentResponsesHandlerService } from './assignment-responses-handler.service'
import { AssignmentResponsesService } from './assignment-responses.service'
import { AssignmentResponseDto, SearchAssignmentResponseQueryDto } from './dto/assignment-response.dto'
import { GradeManualDto } from './dto/grade-manual.dto'
import { PaginatedAssignmentResponseDto } from './dto/paginated.dto'
import { RepliesPlainDto } from './dto/submit-answers.dto'

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): TokenUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: TokenUser }>()
    return request.user
})

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assignment-responses')
export class AssignmentResponsesController {
    constructor(
        private readonly assignmentResponsesService: AssignmentResponsesService,
        private readonly assignmentResponsesHandlerService: AssignmentResponsesHandlerService
    ) {}

    @Post(':assignmentId/start')
    @Roles(Role.Student)
    @ApiOperation({
        summary: '[Student] Starts an assignment',
        description: 'Creates a new assignment response record for the logged-in student.',
    })
    @ApiResponse({ status: 201, type: AssignmentForm })
    startAssignment(@Param('assignmentId') assignmentId: string, @GetUser() user: TokenUser): Promise<any> {
        return this.assignmentResponsesHandlerService.startAssignment(assignmentId, user.id.toString())
    }

    @Patch(':assignmentId/submit')
    @Roles(Role.Student)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: '[Student] Submits answers for an assignment they have started' })
    @ApiResponse({ status: 204, description: 'Answers submitted successfully.' })
    @ApiBody({
        description: "A JSON object where keys are question IDs and values are the student's answers.",
        // type: RepliesPlainDto,
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
    @ApiResponse({ status: 204, description: 'Answers submitted successfully.' })
    submitAnswers(
        @Param('assignmentId') assignmentId: string,
        @GetUser() user: TokenUser,
        @Body() replies: RepliesPlainDto
    ): Promise<void> {
        return this.assignmentResponsesHandlerService.submitAnswers(assignmentId, user.id.toString(), replies)
    }

    @Patch(':id/grade')
    @Roles(Role.Manager)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: '[Manager] Manually grades/overrides scores for a response' })
    @ApiResponse({ status: 204, description: 'Response graded successfully.' })
    gradeManual(
        @Param('id') responseId: string,
        @GetUser() user: TokenUser,
        @Body() gradeManualDto: GradeManualDto
    ): Promise<void> {
        return this.assignmentResponsesHandlerService.grade(responseId, user.id.toString(), gradeManualDto)
    }

    @ApiOperation({ summary: '[Manager] Searches for assignment responses', description: 'Searches for assignment responses' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: PaginatedAssignmentResponseDto,
        description: 'Got assignment responses successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    index(@Query() searchAssignmentResponseQueryDto: SearchAssignmentResponseQueryDto): Promise<PaginatedAssignmentResponseDto> {
        return this.assignmentResponsesService.search(searchAssignmentResponseQueryDto)
    }

    @Get(':id')
    @Roles(Role.Manager, Role.Student)
    @ApiOperation({ summary: '[Student/Manager] Get a single assignment response by ID' })
    @ApiResponse({ status: 200, type: AssignmentResponseDto })
    show(@Param('id') responseId: string, @GetUser() user: TokenUser): Promise<AssignmentResponseDto> {
        return this.assignmentResponsesService.findOneById(responseId, user)
    }

    @ApiOperation({
        summary: '[Manager] Removes a assignment response',
        description: 'Removes a assignment response from the manager.',
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Assignment Response successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment Response not found.' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @ApiBearerAuth()
    remove(@GetUser() user: TokenUser, @Param('id') assignmentresponseId: string): Promise<void> {
        return this.assignmentResponsesService.remove(assignmentresponseId, user)
    }
}
