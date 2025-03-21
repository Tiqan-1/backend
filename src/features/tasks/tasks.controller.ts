import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { CreateTaskDto, TaskDto, UpdateTaskDto } from './dto/task.dto'
import { TasksService } from './tasks.service'

@ApiBearerAuth()
@Controller('api/tasks')
export class TasksController {
    constructor(private service: TasksService) {}

    @ApiOperation({ summary: 'Creates a task', description: 'Creates a task.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Task successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() task: CreateTaskDto): Promise<CreatedDto> {
        return this.service.create(task)
    }

    @ApiOperation({ summary: 'Gets a task', description: 'Gets a task.' })
    @ApiResponse({ status: HttpStatus.OK, type: TaskDto, description: 'Task successfully found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    get(@Param('id') id: string): Promise<TaskDto> {
        return this.service.findById(id)
    }

    @ApiOperation({ summary: 'Updates a task', description: 'Updates a task.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Body() task: UpdateTaskDto, @Param('id') id: string): Promise<void> {
        if (Object.keys(task).length === 0) {
            throw new BadRequestException('Task not found.')
        }
        return this.service.update(id, task)
    }

    @ApiOperation({ summary: 'Deletes a task', description: 'Deletes a task.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    delete(@Param('id') id: string): Promise<void> {
        return this.service.delete(id)
    }
}
