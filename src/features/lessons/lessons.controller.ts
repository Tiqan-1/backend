import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateLessonDto, LessonDto, SearchLessonsQueryDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonsService } from './lessons.service'

@ApiBearerAuth()
@Controller('api/lessons')
export class LessonsController {
    constructor(private readonly service: LessonsService) {}

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
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createLessonDto: CreateLessonDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(createLessonDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets lessons of the subject.', description: `Gets lessons of the subject.` })
    @ApiResponse({ status: HttpStatus.OK, type: LessonDto, isArray: true, description: 'Got lessons successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    find(@Query() queryDto: SearchLessonsQueryDto): Promise<LessonDto[]> {
        return this.service.find(queryDto)
    }

    @ApiOperation({ summary: 'Updates a lesson', description: 'Updates a lesson.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    update(@Param('id') id: string, @Body() lesson: UpdateLessonDto): Promise<void> {
        return this.service.update(id, lesson)
    }

    @ApiOperation({ summary: 'Removes a lesson', description: 'Removes a lesson from the subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject or Lesson not found.' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    remove(@Param('id') lessonId: string): Promise<void> {
        return this.service.remove(lessonId)
    }
}
