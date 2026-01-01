import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { TokenUser } from '../authentication/types/token-user'
import { PaginatedProgramDto, PaginatedProgramWithSubscriptionDto } from '../programs/dto/paginated-program.dto'
import { SearchStudentProgramQueryDto } from '../programs/dto/program.dto'
import { PaginatedStudentSubscriptionDto } from '../subscriptions/dto/paginated-subscripition.dto'
import { SearchSubscriptionsQueryDto } from '../subscriptions/dto/search-subscriptions-query.dto'
import { CreateSubscriptionDto, CreateSubscriptionV2Dto } from '../subscriptions/dto/subscription.dto'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentsService } from './students.service'

@Controller('api/students')
export class StudentsController {
    constructor(private readonly service: StudentsService) {}

    @ApiOperation({ summary: 'Signs a student-user up', description: 'Signs a student-user up and returns the created user.' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'The user got created successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'A user with the same email address already exists.',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpStudentDto: SignUpStudentDto): Promise<void> {
        return this.service.create(signUpStudentDto)
    }

    @ApiOperation({ summary: 'Removes the student.', description: 'Removes the student.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The user got deleted successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    delete(@Request() request: { user: TokenUser }): Promise<void> {
        return this.service.remove(request.user.id)
    }

    @ApiOperation({
        summary: 'Creates a subscription.',
        description: 'Creates a subscription for the student.',
        deprecated: true,
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'The id of the created subscription.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Student already have the same subscription.', type: ErrorDto })
    @Post('subscriptions/subscribe')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
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
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program or Level not found.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.NOT_ACCEPTABLE,
        description: 'Trying to subscribe to a program or a level that is not open for registration.',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Student already have the same subscription.', type: ErrorDto })
    @Post('subscriptions')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    subscribe(
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.subscribe(createSubscriptionDto, request.user.id)
    }

    @ApiOperation({
        summary: 'Creates a subscription.',
        description: 'Creates a subscription for the student in the specified program.',
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'The id of the created subscription.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.NOT_ACCEPTABLE,
        description: 'Trying to subscribe to a program that is not open for registration.',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Student already have the same subscription.', type: ErrorDto })
    @Post('subscriptions/v2/create')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    subscribeV2(
        @Body() createSubscriptionDto: CreateSubscriptionV2Dto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.subscribeV2(createSubscriptionDto, request.user.id)
    }

    @ApiOperation({ summary: 'Finds subscriptions', description: 'Finds subscriptions of the student.' })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedStudentSubscriptionDto, description: 'Got subscriptions successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @Get('subscriptions/v2')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    findSubscriptions(
        @Query() query: SearchSubscriptionsQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedStudentSubscriptionDto> {
        return this.service.findSubscriptions(query, request.user.id)
    }

    @ApiOperation({ summary: 'Suspends a subscription', description: 'Suspends a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully suspended.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @Put('subscriptions/:id/suspend')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    suspendSubscription(@Param('id') subscriptionId: string, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.suspendSubscription(subscriptionId, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a subscription', description: `Removes a subscription from the student's subscriptions.` })
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'Subscription removed successfully.',
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @Delete('subscriptions/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    removeSubscription(@Param('id') subscriptionId: string, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.removeSubscription(subscriptionId, request.user.id)
    }

    @ApiOperation({ summary: 'Gets programs', description: 'Gets programs.', deprecated: true })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedProgramDto, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Get('programs/v2')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    findPrograms(@Query() query: SearchStudentProgramQueryDto): Promise<PaginatedProgramDto> {
        return this.service.findPrograms(query)
    }

    @ApiOperation({
        summary: 'Gets programs',
        description: `Returns programs for students.
            <br />By default:<br />
            <ul>
                <li>Returns all published programs.
            </ul>
            <br />The default behavior can be overridden by setting filters in the query parameters.`,
    })
    @ApiQuery({ name: 'limit', type: String, required: false, description: 'Controls the number of returned elements' })
    @ApiQuery({ name: 'skip', type: String, required: false, description: 'Controls the number of elements to be skipped' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedProgramWithSubscriptionDto, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @Get('v3/programs')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Roles(Role.Student)
    findProgramsV3(
        @Query() query: SearchStudentProgramQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedProgramWithSubscriptionDto> {
        return this.service.findProgramsV3(query, request.user.id)
    }
}
