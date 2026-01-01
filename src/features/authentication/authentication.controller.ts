import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpRedirectResponse,
    HttpStatus,
    Param,
    Post,
    Put,
    Redirect,
    Request,
    UseGuards,
} from '@nestjs/common'
import { ApiBasicAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ParseMongoIdPipe } from '../../shared/pipes/ParseMongoIdPipe'
import { ObjectId } from '../../shared/repository/types'
import { UserDocument } from '../users/schemas/user.schema'
import { AuthenticationService } from './authentication.service'
import { AuthenticationRequestDto } from './dto/authentication-request.dto'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'
import { ChangePasswordRequestDto } from './dto/change-password-request.dto'
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto'
import { ManagersLocalAuthGuard } from './guards/managers-local-auth-guard.service'
import { StudentsLocalAuthGuard } from './guards/students-local-auth-guard.service'

@Controller('api/authentication')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) {}

    @ApiOperation({ summary: 'Activates user account', description: 'activates user account.' })
    @ApiResponse({ status: HttpStatus.FOUND, description: 'The user account got verified successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User is not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User is not in a verifiable state.', type: ErrorDto })
    @ApiParam({ name: 'id', type: String, description: 'The id of the user to be verified.' })
    @HttpCode(HttpStatus.FOUND)
    @Get('verify/:id')
    @Redirect()
    async verify(@Param('id', ParseMongoIdPipe) id: ObjectId): Promise<HttpRedirectResponse> {
        const redirectUrl = await this.authenticationService.verify(id)
        return { url: redirectUrl, statusCode: HttpStatus.FOUND }
    }

    @ApiOperation({ summary: 'Sends email to reset password', description: 'Sends email to reset password.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The password reset email was sent successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User is not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User account is not activated.', type: ErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Get('forgot-password/:email')
    forgotPassword(@Param('email') email: string): Promise<void> {
        return this.authenticationService.sendPasswordResetCode(email)
    }

    @ApiOperation({ summary: 'Sends email to reset password', description: 'Sends email to reset password.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The password reset email was sent successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_ACCEPTABLE, description: 'Verification code is invalid.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put('change-password')
    async changePassword(@Body() dto: ChangePasswordRequestDto): Promise<void> {
        return await this.authenticationService.changePassword(dto)
    }

    @ApiOperation({
        summary: 'Logs a student-user in',
        description: 'Logs a student-user in and returns the tokens to be used in further calls.',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user logged in successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid username or password.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Invalid user role (trying to login a manager as a student).',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_ACCEPTABLE, description: 'Student account not active.', type: ErrorDto })
    @ApiBody({ type: AuthenticationRequestDto })
    @ApiBasicAuth()
    @HttpCode(HttpStatus.OK)
    @UseGuards(StudentsLocalAuthGuard)
    @Post('login')
    login(@Request() req: { user: UserDocument }): Promise<AuthenticationResponseDto> | undefined {
        return this.authenticationService.login(req.user)
    }

    @ApiOperation({
        summary: 'Logs a manager-user in',
        description: 'Logs a manager-user in and returns the tokens to be used in further calls.',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user logged in successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid username or password.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Invalid user role (trying to login a student as a manager).',
        type: ErrorDto,
    })
    @ApiBody({ type: AuthenticationRequestDto })
    @ApiBasicAuth()
    @HttpCode(HttpStatus.OK)
    @UseGuards(ManagersLocalAuthGuard)
    @Post('manager-login')
    loginManager(@Request() req: { user: UserDocument }): Promise<AuthenticationResponseDto> | undefined {
        return this.authenticationService.login(req.user)
    }

    @ApiBody({ type: RefreshTokenRequestDto })
    @ApiOperation({ summary: 'Logs a user out', description: 'Logs a user out' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user got logged out successfully.' })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Refresh token is invalid.',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string): Promise<void> {
        return this.authenticationService.logout(refreshToken)
    }

    @ApiOperation({ summary: 'Refreshes the tokens', description: 'Refreshes the tokens for the session' })
    @ApiBody({ type: RefreshTokenRequestDto })
    @ApiResponse({ status: HttpStatus.OK, description: 'Tokens got refreshed successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.CREATED)
    @Post('refresh-tokens')
    refreshTokens(@Body('refreshToken') refreshToken: string): Promise<AuthenticationResponseDto> {
        return this.authenticationService.refreshTokens(refreshToken)
    }
}
