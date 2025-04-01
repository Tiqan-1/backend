import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { CreateTaskDto, TaskDto } from '../tasks/dto/task.dto'
import { LevelDto, UpdateLevelDto } from './dto/level.dto'
import { LevelsService } from './levels.service'

@ApiBearerAuth()
@Controller('api/levels')
export class LevelsController {
    constructor(private readonly levelsService: LevelsService) {}

    @ApiOperation({ summary: 'Gets a level', description: 'Gets a level.' })
    @ApiResponse({ status: HttpStatus.OK, type: LevelDto, description: 'Level successfully found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string): Promise<LevelDto> {
        return this.levelsService.findOne(id)
    }

    @ApiOperation({ summary: 'Updates a level', description: 'Updates a level.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Level successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto): Promise<void> {
        return this.levelsService.update(id, updateLevelDto)
    }

    @ApiOperation({ summary: 'Deletes a level', description: 'Deletes a level.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Level successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    remove(@Param('id') id: string): Promise<void> {
        return this.levelsService.remove(id)
    }

    @ApiOperation({ summary: 'Creates a task', description: 'Creates a task and adds it to the level.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Task successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @Post(':id/tasks')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    createTask(@Body() createTaskDto: CreateTaskDto, @Param('id') levelId: string): Promise<CreatedDto> {
        return this.levelsService.createTask(levelId, createTaskDto)
    }

    @ApiOperation({ summary: 'Gets tasks of the level', description: `Gets tasks of the level.` })
    @ApiResponse({ status: HttpStatus.OK, type: TaskDto, isArray: true, description: 'Got tasks successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':levelId/tasks')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getTasks(@Param('levelId') levelId: string): Promise<TaskDto[]> {
        return this.levelsService.getTasks(levelId)
    }

    @ApiOperation({ summary: 'Removes a task', description: 'Removes a task from the level.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @Delete(':levelId/tasks/:taskId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeTask(@Param('levelId') levelId: string, @Param('taskId') taskId: string): Promise<void> {
        return this.levelsService.removeTask(levelId, taskId)
    }
}
