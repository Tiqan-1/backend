import {
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
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ParseMongoIdPipe } from '../../shared/pipes/ParseMongoIdPipe'
import { ObjectId } from '../../shared/repository/types'
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

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assignments')
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) {}

    @ApiOperation({ summary: '[Manager] Creates a assignment', description: `Creates a assignment.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Assignment successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Manager)
    create(@Body() createAssignmentDto: CreateAssignmentDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.assignmentsService.create(createAssignmentDto, request.user.id)
    }

    @ApiOperation({ summary: '[Manager/Student] Get a single assignment by ID' })
    @ApiResponse({ status: HttpStatus.OK, type: AssignmentDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Manager, Role.Student)
    findOne(@Param('id', ParseMongoIdPipe) assignmentId: ObjectId, @GetUser() user: TokenUser): Promise<AssignmentDto> {
        if (user.role == Role.Manager) {
            return this.assignmentsService.findForManager(assignmentId, user.id)
        }
        return this.assignmentsService.findForStudent(assignmentId, user.id)
    }

    @ApiOperation({ summary: '[Manager] Searches for assignments', description: 'Searches for assignments' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedAssignmentDto, description: 'Got assignments successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    search(
        @Query() searchAssignmentQueryDto: SearchAssignmentQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedAssignmentDto> {
        return this.assignmentsService.search(searchAssignmentQueryDto, request.user.id)
    }

    @ApiOperation({ summary: '[Student] Get a list of available assignments' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedAssignmentStudentDto, description: 'Got assignments successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @Get('available')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Student)
    findForStudent(@GetUser() student: TokenUser): Promise<PaginatedAssignmentStudentDto> {
        return this.assignmentsService.findAvailableForStudent(student.id)
    }

    @ApiOperation({ summary: '[Manager] Updates a assignment', description: 'Updates an assignment.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Assignment successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Body() updateAssignmentDto: UpdateAssignmentDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
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
    remove(
        @Request() request: { user: TokenUser },
        @Param('assignmentId', ParseMongoIdPipe) assignmentId: ObjectId
    ): Promise<void> {
        return this.assignmentsService.remove(assignmentId, request.user.id)
    }

    @ApiOperation({ summary: '[Manager] Publishes all graded responses for an assignment' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Grades published successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Assignment not found.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Assignment not in an acceptable state.' })
    @ApiResponse({ status: HttpStatus.NOT_ACCEPTABLE, description: 'Not all submissions are graded.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Patch(':id/publish-grades')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Manager)
    @HttpCode(HttpStatus.NO_CONTENT)
    publishGrades(@Param('id', ParseMongoIdPipe) assignmentId: ObjectId, @GetUser() manager: TokenUser): Promise<void> {
        return this.assignmentsService.publishGrades(assignmentId, manager.id)
    }
}
