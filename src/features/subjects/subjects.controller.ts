import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateLessonDto, LessonDto } from '../lessons/dto/lesson.dto'
import { CreateSubjectDto, SearchSubjectQueryDto, SubjectDto, UpdateSubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: `Creates a subject and adds it to the current manager.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Subject successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    create(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(subject, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for subjects', description: 'Searches for subjects.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    find(@Query() searchSubjectQueryDto: SearchSubjectQueryDto, @Request() request: { user: TokenUser }): Promise<SubjectDto[]> {
        return this.service.find(searchSubjectQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for subjects', description: 'Searches for subjects.', deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    search(
        @Query() searchSubjectQueryDto: SearchSubjectQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<SubjectDto[]> {
        return this.service.find(searchSubjectQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Finds subject by id', description: 'Finds subject by id.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, description: 'Got subject successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(@Param('id') id: string): Promise<SubjectDto> {
        return this.service.findOne(id)
    }

    @ApiOperation({ summary: 'Updates a subject', description: 'Updates a subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() dto: UpdateSubjectDto, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.update(id, dto, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a subject', description: 'Removes a subject from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @Delete(':subjectId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    remove(@Request() request: { user: TokenUser }, @Param('subjectId') subjectId: string): Promise<void> {
        return this.service.remove(subjectId, request.user.id)
    }

    @ApiOperation({ summary: 'Creates a lesson', description: 'Creates a lesson and adds it to the subject.' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        type: CreatedDto,
        description: 'Lesson successfully created and added to the subject.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @Post(':subjectId/lessons')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    createLesson(@Param('subjectId') subjectId: string, @Body() createLessonDto: CreateLessonDto): Promise<CreatedDto> {
        return this.service.createLesson(subjectId, createLessonDto)
    }

    @ApiOperation({ summary: 'Gets lessons of the subject.', description: `Gets lessons of the subject.` })
    @ApiResponse({ status: HttpStatus.OK, type: LessonDto, isArray: true, description: 'Got lessons successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':subjectId/lessons')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getLessons(@Param('subjectId') subjectId: string): Promise<LessonDto[]> {
        return this.service.getLessons(subjectId)
    }

    @ApiOperation({ summary: 'Removes a lesson', description: 'Removes a lesson from the subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject or Lesson not found.' })
    @Delete(':subjectId/lessons/:lessonId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeLessons(@Param('subjectId') subjectId: string, @Param('lessonId') lessonId: string): Promise<void> {
        return this.service.removeLesson(subjectId, lessonId)
    }
}
