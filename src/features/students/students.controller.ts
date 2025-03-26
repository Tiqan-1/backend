import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { TokenUser } from '../authentication/types/token-user'
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

    @ApiOperation({ summary: 'Creates a subscription.', description: 'Creates a subscription for the student.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'The id of the created subscription.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post('subscriptions/subscribe')
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    createSubscription(
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.service.createSubscription(createSubscriptionDto, request.user.id)
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

    @ApiOperation({ summary: 'Gets subscriptions', description: 'Gets subscriptions of the student.' })
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
    getSubscriptions(@Request() request: { user: TokenUser }): Promise<StudentSubscriptionDto[]> {
        return this.service.getSubscriptions(request.user.id)
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
}
