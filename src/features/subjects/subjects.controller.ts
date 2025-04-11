import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { CreateLessonDto, LessonDto } from '../lessons/dto/lesson.dto'
import { SearchSubjectQueryDto, SubjectDto, UpdateSubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

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
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<SubjectDto[]> {
        return this.service.findAll(limit, skip)
    }

    @ApiOperation({ summary: 'Searches for subjects', description: 'Searches for subjects.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @Get('search')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    search(@Query() searchSubjectQueryDto: SearchSubjectQueryDto): Promise<SubjectDto[]> {
        return this.service.search(searchSubjectQueryDto)
    }

    @ApiOperation({ summary: 'Finds subject by id', description: 'Finds subject by id.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, description: 'Got subject successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('/:id')
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
    update(@Param('id') id: string, @Body() dto: UpdateSubjectDto): Promise<void> {
        return this.service.update(id, dto)
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
