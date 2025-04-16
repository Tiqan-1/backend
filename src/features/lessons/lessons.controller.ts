import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { LessonDto, SearchLessonsQueryDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonsService } from './lessons.service'

@ApiBearerAuth()
@Controller('api/lessons')
export class LessonsController {
    constructor(private readonly service: LessonsService) {}

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
}
