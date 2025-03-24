import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: 'Creates a subject.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Subject successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(subject, request.user)
    }

    @ApiOperation({ summary: 'Adds a lesson to a subject', description: 'Adds a lesson to a subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully added.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'given subjectId or lessonId are not valid.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'subject or lesson were not found.' })
    @Put(':subjectId/:lessonId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    addLessonToSubject(@Param('subjectId') subjectId: string, @Param('lessonId') lessonId: string): Promise<void> {
        return this.service.addLessonToSubject(subjectId, lessonId)
    }

    @ApiOperation({ summary: 'Finds all subjects created by user', description: 'Finds all subjects created by user.' })
    @ApiQuery({ name: 'limit', type: String, required: false })
    @ApiQuery({ name: 'skip', type: String, required: false })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('user')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAllByManagerId(
        @Request() request: { user: TokenUser },
        @Query('limit') limit?: number,
        @Query('skip') skip?: number
    ): Promise<SubjectDto[]> {
        return this.service.findAllByManagerId(request.user, limit, skip)
    }

    @ApiOperation({ summary: 'Finds all subjects', description: 'Finds all subjects.' })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Controls the number of returned elements',
        default: 20,
    })
    @ApiQuery({
        name: 'skip',
        type: Number,
        required: false,
        description: 'Controls the number of elements to be skipped (for paging)',
        default: 0,
    })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<SubjectDto[]> {
        return this.service.findAll(limit, skip)
    }

    @ApiOperation({ summary: 'Finds subject by id', description: 'Finds subject by id.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, description: 'Got subject successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('/:id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(@Param('id') id: string): Promise<SubjectDto> {
        return this.service.findOne(id)
    }
}
