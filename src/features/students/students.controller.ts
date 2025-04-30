import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { TokenUser } from '../authentication/types/token-user'
import { PaginatedProgramDto } from '../programs/dto/paginated-program.dto'
import { SearchStudentProgramQueryDto, StudentProgramDto } from '../programs/dto/program.dto'
import { PaginatedStudentSubscriptionDto } from '../subscriptions/dto/paginated-subscripition.dto'
import { SearchStudentSubscriptionsQueryDto } from '../subscriptions/dto/search-subscriptions-query.dto'
import { CreateSubscriptionDto, StudentSubscriptionDto } from '../subscriptions/dto/subscription.dto'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentsService } from './students.service'

@Controller('api/students')
export class StudentsController {
    constructor(private readonly service: StudentsService) {}

    @ApiOperation({ summary: 'Signs a student-user up', description: 'Signs a student-user up and returns the created user.' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'The user got created successfully.',
        type: AuthenticationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A user with the same email address already exists.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpStudentDto: SignUpStudentDto): Promise<AuthenticationResponseDto> {
        return this.service.create(signUpStudentDto)
    }

    @ApiOperation({ summary: 'Removes the student.', description: 'Removes the student.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The user got deleted successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Student)
    @ApiBearerAuth()
    delete(@Request() request: { user: TokenUser }): Promise<void> {
        return this.service.remove(request.user.id)
    }

    @ApiOperation({
        summary: 'Creates a subscription.',
        description: 'Creates a subscription for the student.',
        deprecated: true,
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'The id of the created subscription.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Student already have the same subscription.' })
    @Post('subscriptions/subscribe')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    createSubscription(
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.subscribe(createSubscriptionDto, request.user.id)
    }

    @ApiOperation({
        summary: 'Creates a subscription.',
        description: 'Creates a subscription for the student.',
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'The id of the created subscription.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program or Level not found.' })
    @ApiResponse({
        status: HttpStatus.NOT_ACCEPTABLE,
        description: 'Trying to subscribe to a program or a level that is not open for registration.',
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Student already have the same subscription.' })
    @Post('subscriptions')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    subscribe(
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.subscribe(createSubscriptionDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets subscriptions', description: 'Gets subscriptions of the student.', deprecated: true })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: StudentSubscriptionDto,
        isArray: true,
        description: 'Got subscriptions successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get('subscriptions')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getSubscriptions(
        @Request() request: { user: TokenUser },
        @Query('limit') limit?: number,
        @Query('skip') skip?: number
    ): Promise<StudentSubscriptionDto[]> {
        return this.service.getSubscriptions(request.user.id, limit, skip)
    }

    @ApiOperation({ summary: 'Finds subscriptions', description: 'Finds subscriptions of the student.' })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedStudentSubscriptionDto, description: 'Got subscriptions successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get('subscriptions/v2')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    findSubscriptions(
        @Query() query: SearchStudentSubscriptionsQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedStudentSubscriptionDto> {
        return this.service.findSubscriptions(query, request.user.id)
    }

    @ApiOperation({ summary: 'Suspends a subscription', description: 'Suspends a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully suspended.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put('subscriptions/:id/suspend')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    suspendSubscription(@Param('id') subscriptionId: string, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.suspendSubscription(subscriptionId, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a subscription', description: `Removes a subscription from the student's subscriptions.` })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Subscription removed successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Delete('subscriptions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    removeSubscription(@Param('id') subscriptionId: string, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.removeSubscription(subscriptionId, request.user.id)
    }

    @ApiOperation({
        summary: 'Gets open programs',
        description: 'Gets programs that are currently open for registration.',
        deprecated: true,
    })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({
        status: HttpStatus.OK,
        type: StudentProgramDto,
        isArray: true,
        description: 'Got programs successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get('open-programs')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    getOpenPrograms(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<StudentProgramDto[]> {
        return this.service.getOpenPrograms(limit, skip)
    }

    @ApiOperation({ summary: 'Gets open programs', description: 'Gets programs that are currently open for registration.' })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedProgramDto, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @Get('open-programs/v2')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    findOpenPrograms(@Query() query: SearchStudentProgramQueryDto): Promise<PaginatedProgramDto> {
        return this.service.findOpenPrograms(query)
    }
}
