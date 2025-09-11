import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ParseMongoIdPipe } from '../../shared/pipes/ParseMongoIdPipe'
import { ObjectId } from '../../shared/repository/types'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { PaginatedTaskDto } from './dto/paginated-task.dto'
import { CreateTaskDto, SearchTasksQueryDto, UpdateTaskDto } from './dto/task.dto'
import { TasksService } from './tasks.service'

@ApiBearerAuth()
@Controller('api/tasks')
export class TasksController {
    constructor(private service: TasksService) {}

    @ApiOperation({ summary: 'Creates a task', description: 'Creates a task and adds it to the level.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Task successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Level not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createTaskDto: CreateTaskDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(createTaskDto, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for tasks', description: `Searches for tasks.` })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedTaskDto, description: 'Got tasks successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    find(@Query() query: SearchTasksQueryDto, @Request() request: { user: TokenUser }): Promise<PaginatedTaskDto> {
        return this.service.find(query, request.user.id)
    }

    @ApiOperation({ summary: 'Updates a task', description: 'Updates a task.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(
        @Body() task: UpdateTaskDto,
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.update(id, task, request.user.id)
    }

    @ApiOperation({ summary: 'Deletes a task', description: 'Deletes a task.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    delete(@Param('id') id: string): Promise<void> {
        return this.service.remove(id)
    }
}
