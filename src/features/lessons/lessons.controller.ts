import { Body, Controller, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { CreateLessonDto, LessonDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonsService } from './lessons.service'

@ApiBearerAuth()
@Controller('api/lessons')
export class LessonsController {
    constructor(private readonly service: LessonsService) {}

    @ApiOperation({
        summary: 'Creates a lesson',
        description: 'Deprecated: use POST api/subjects/{subjectId}/lessons instead..',
        deprecated: true,
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: LessonDto, description: 'Lesson successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() lesson: CreateLessonDto): Promise<LessonDto> {
        return this.service.create(lesson)
    }

    @ApiOperation({ summary: 'Updates a lesson', description: 'Updates a lesson.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, type: LessonDto, description: 'Lesson successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() lesson: UpdateLessonDto): Promise<void> {
        return this.service.update(id, lesson)
    }
}
