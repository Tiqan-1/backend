import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateTaskDto, TaskDto } from '../tasks/dto/task.dto'
import { CreateLevelDto, SearchLevelsQueryDto, UpdateLevelDto } from './dto/level.dto'
import { PaginatedLevelDto } from './dto/paginated-level.dto'
import { LevelsService } from './levels.service'

@ApiBearerAuth()
@Controller('api/levels')
export class LevelsController {
    constructor(private readonly service: LevelsService) {}

    @ApiOperation({ summary: 'Creates a level', description: 'Creates a level and adds it to the program.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Level successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createLevelDto: CreateLevelDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(createLevelDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets levels of the program', description: `Gets levels of the program.` })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedLevelDto, description: 'Got levels successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    find(@Query() searchQuery: SearchLevelsQueryDto): Promise<PaginatedLevelDto> {
        return this.service.find(searchQuery)
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
        return this.service.update(id, updateLevelDto)
    }

    @ApiOperation({ summary: 'Removes a level', description: 'Removes a level.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Level successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    remove(@Param('id') id: string): Promise<void> {
        return this.service.remove(id)
    }

    @ApiOperation({ summary: 'Creates a task', description: 'Creates a task and adds it to the level.', deprecated: true })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Task successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.' })
    @Post(':id/tasks')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    createTask(
        @Body() createTaskDto: CreateTaskDto,
        @Param('id') levelId: string,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.createTask(levelId, createTaskDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets tasks of the level', description: `Gets tasks of the level.`, deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: TaskDto, isArray: true, description: 'Got tasks successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':levelId/tasks')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getTasks(@Param('levelId') levelId: string): Promise<TaskDto[]> {
        return this.service.getTasks(levelId)
    }

    @ApiOperation({ summary: 'Removes a task', description: 'Removes a task from the level.', deprecated: true })
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
        return this.service.removeTask(levelId, taskId)
    }
}
