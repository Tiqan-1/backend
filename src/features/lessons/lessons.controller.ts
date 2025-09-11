import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateLessonDto, SearchLessonsQueryDto, UpdateLessonDto } from './dto/lesson.dto'
import { PaginatedLessonDto } from './dto/paginated-lesson.dto'
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
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.', type: ErrorDto })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createLessonDto: CreateLessonDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(createLessonDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets lessons of the subject.', description: `Gets lessons of the subject.` })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedLessonDto, description: 'Got lessons successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    find(@Query() queryDto: SearchLessonsQueryDto, @Request() request: { user: TokenUser }): Promise<PaginatedLessonDto> {
        return this.service.find(queryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Updates a lesson', description: 'Updates a lesson.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Put(':id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    update(@Param('id') id: string, @Body() lesson: UpdateLessonDto): Promise<void> {
        return this.service.update(id, lesson)
    }

    @ApiOperation({ summary: 'Removes a lesson', description: 'Removes a lesson from the subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Lesson successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject or Lesson not found.', type: ErrorDto })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    remove(@Param('id') lessonId: string): Promise<void> {
        return this.service.remove(lessonId)
    }
}
