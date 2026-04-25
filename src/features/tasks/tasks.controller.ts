import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
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
import { BookSlotDto } from './dto/book-slot.dto'
import { CancelBookingDto } from './dto/cancel-booking.dto'
import { CompleteTaskDto } from './dto/complete-task.dto'
import { GradeSlotDto } from './dto/grade-slot.dto'
import { OralTestBookingDto } from './dto/oral-test-booking.dto'
import { CreateOralTestSlotDto, OralTestSlotDto } from './dto/oral-test-slot.dto'
import { PaginatedTaskDto } from './dto/paginated-task.dto'
import { ReplaceSlotsDto } from './dto/replace-slots.dto'
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
    delete(@Param('id', ParseMongoIdPipe) id: ObjectId, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.remove(id, request.user.id)
    }

    @ApiOperation({ summary: 'Marks a task as completed', description: 'Marks a task as completed for the user.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully marked as completed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @Post(':id/complete')
    @ApiParam({ name: 'id', type: String, required: true })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Student)
    @UseGuards(JwtAuthGuard, RolesGuard)
    complete(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Body() completeTaskDto: CompleteTaskDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> | undefined {
        return this.service.complete(id, completeTaskDto, request.user.id)
    }

    // ───── OralTest sub-resources ─────

    @ApiOperation({
        summary: 'Lists slots for an OralTest task',
        description: 'Manager owner sees full slot data; students see only availability.',
    })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiResponse({ status: HttpStatus.OK, type: [OralTestSlotDto] })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @Get(':id/slots')
    @Roles(Role.Manager, Role.Student)
    @UseGuards(JwtAuthGuard, RolesGuard)
    listSlots(@Param('id', ParseMongoIdPipe) id: ObjectId, @Request() request: { user: TokenUser }): Promise<OralTestSlotDto[]> {
        return this.service.listSlots(id, request.user)
    }

    @ApiOperation({ summary: 'Adds a slot to an OralTest task' })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestErrorDto })
    @Post(':id/slots')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    addSlot(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Body() slotDto: CreateOralTestSlotDto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.addSlot(id, slotDto, request.user.id)
    }

    @ApiOperation({
        summary: 'Replaces all slots on an OralTest task',
        description: 'Refuses if any existing slot is already booked.',
    })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorDto })
    @Put(':id/slots')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    replaceSlots(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Body() body: ReplaceSlotsDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.replaceSlots(id, body, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a slot from an OralTest task', description: 'Refuses if the slot is currently booked.' })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiParam({ name: 'slotId', type: String, required: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorDto })
    @Delete(':id/slots/:slotId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeSlot(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Param('slotId', ParseMongoIdPipe) slotId: ObjectId,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.removeSlot(id, slotId, request.user.id)
    }

    @ApiOperation({ summary: 'Books a slot on an OralTest task' })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiParam({ name: 'slotId', type: String, required: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorDto, description: 'Slot already booked.' })
    @Post(':id/slots/:slotId/book')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Student)
    @UseGuards(JwtAuthGuard, RolesGuard)
    bookSlot(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Param('slotId', ParseMongoIdPipe) slotId: ObjectId,
        @Body() body: BookSlotDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.bookSlot(id, slotId, body, request.user.id)
    }

    @ApiOperation({
        summary: 'Cancels a booking on an OralTest slot',
        description: 'Manager-owner only. The slot becomes bookable again.',
    })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiParam({ name: 'slotId', type: String, required: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorDto })
    @Delete(':id/slots/:slotId/booking')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    cancelBooking(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Param('slotId', ParseMongoIdPipe) slotId: ObjectId,
        @Body() body: CancelBookingDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.cancelBooking(id, slotId, body, request.user.id)
    }

    @ApiOperation({
        summary: 'Submits a grade for a booked OralTest slot',
        description: 'On first grade, marks the task as completed in the student subscription.',
    })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiParam({ name: 'slotId', type: String, required: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorDto })
    @Post(':id/slots/:slotId/grade')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    gradeSlot(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Param('slotId', ParseMongoIdPipe) slotId: ObjectId,
        @Body() body: GradeSlotDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        return this.service.gradeSlot(id, slotId, body, request.user.id)
    }

    @ApiOperation({
        summary: 'Lists bookings for an OralTest task',
        description: 'Manager-owner only. Returns hydrated student data per booked slot.',
    })
    @ApiParam({ name: 'id', type: String, required: true })
    @ApiResponse({ status: HttpStatus.OK, type: [OralTestBookingDto] })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorDto })
    @Get(':id/bookings')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    listBookings(
        @Param('id', ParseMongoIdPipe) id: ObjectId,
        @Request() request: { user: TokenUser }
    ): Promise<OralTestBookingDto[]> {
        return this.service.listBookings(id, request.user.id)
    }
}
