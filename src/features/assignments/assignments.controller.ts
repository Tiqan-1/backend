import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { GetUser } from '../assignment-responses/assignment-responses.controller'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { AssignmentsService } from './assignments.service'
import {
    AssignmentDto,
    CreateAssignmentDto,
    PaginatedAssignmentDto,
    SearchAssignmentQueryDto,
    UpdateAssignmentDto,
} from './dto/assignment.dto'
import { PaginatedAssignmentStudentDto } from './dto/student-assignment.dto'
import { AssignmentState } from './enums/assignment-state.enum'

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assignments')
export class AssignmentsController {
    private readonly logger = new Logger(AssignmentsController.name)

    constructor(private readonly assignmentsService: AssignmentsService) {}

    @ApiOperation({ summary: '[Manager] Creates a assignment', description: `Creates a assignment.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Assignment successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @ApiBearerAuth()
    create(@Body() createAssignmentDto: CreateAssignmentDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.assignmentsService.create(createAssignmentDto, request.user.id)
    }

    @ApiOperation({ summary: '[Manager/Student] Get a single assignment by ID' })
    @Get(':id')
    @Roles(Role.Manager, Role.Student)
    @ApiResponse({ status: 200, type: AssignmentDto })
    findOne(@Param('id') assignmentId: string, @GetUser() user: TokenUser): Promise<AssignmentDto> {
        if (user.role == Role.Manager) {
            return this.assignmentsService.showForManager(assignmentId, user.id.toString())
        }
        return this.assignmentsService.showForStudent(assignmentId, user.id.toString())
    }

    @ApiOperation({ summary: '[Manager] Searches for assignments', description: 'Searches for assignments' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedAssignmentDto, description: 'Got assignments successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    find(
        @Query() searchAssignmentQueryDto: SearchAssignmentQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedAssignmentDto> {
        return this.assignmentsService.search(searchAssignmentQueryDto, request.user.id)
    }

    @ApiOperation({ summary: '[Student] Get a list of available assignments and homeworks' })
    @Get('available')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Student)
    @ApiResponse({ status: 200, type: PaginatedAssignmentStudentDto })
    findForStudent(@GetUser() student: TokenUser): Promise<PaginatedAssignmentStudentDto> {
        return this.assignmentsService.findAvailableForStudent(student.id.toString())
    }

    @ApiOperation({ summary: '[Manager] Updates a assignment', description: 'Updates a assignment.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Assignment successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(
        @Param('id') id: string,
        @Body() updateAssignmentDto: UpdateAssignmentDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        if (updateAssignmentDto.state === AssignmentState.deleted) {
            this.logger.error(`Attempt to update state of assignment to deleted.`)
            throw new BadRequestException('Cannot update state to deleted, use the right endpoint to delete the assignment.')
        }
        return this.assignmentsService.update(id, updateAssignmentDto, request.user.id)
    }

    @ApiOperation({ summary: '[Manager] Removes a assignment', description: 'Removes a assignment from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Assignment successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found.' })
    @Delete(':assignmentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    remove(@Request() request: { user: TokenUser }, @Param('assignmentId') assignmentId: string): Promise<void> {
        return this.assignmentsService.remove(assignmentId, request.user.id)
    }

    @Patch(':id/publish-grades')
    @Roles(Role.Manager)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: '[Manager] Publishes all graded responses for an assignment' })
    @ApiResponse({ status: 204, description: 'Grades published successfully.' })
    @ApiResponse({ status: 400, description: 'Cannot publish, not all responses are graded.' })
    publishGrades(@Param('id') assignmentId: string, @GetUser() manager: TokenUser): Promise<void> {
        return this.assignmentsService.publishGrades(assignmentId, manager.id.toString())
    }
}
