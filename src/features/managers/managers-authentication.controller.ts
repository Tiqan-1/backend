import { Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBasicAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HydratedDocument } from 'mongoose'
import { LocalAuthGuard } from '../../shared/guards/local-auth.guard'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationRequestDto } from '../authentication/dto/authentication-request.dto'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { RefreshTokenRequestDto } from '../authentication/dto/refresh-token-request.dto'
import { ManagerDocument } from './schemas/manager.schema'

@Controller('api/managers/authentication')
export class ManagersAuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) {}

    @ApiOperation({
        summary: 'Logs a manager-user in',
        description: 'Logs a manager-user in and returns the tokens to be used in further calls.',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user logged in successfully.', type: AuthenticationResponseDto })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'An internal error occurred while logging the user in.',
    })
    @ApiBody({ type: AuthenticationRequestDto })
    @ApiBasicAuth()
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req: { user: HydratedDocument<ManagerDocument> }): Promise<AuthenticationResponseDto> | undefined {
        if (req.user) {
            return this.authenticationService.login(req.user.id as string)
        }
        throw new InternalServerErrorException('User not found in session.')
    }

    @ApiBody({ type: RefreshTokenRequestDto })
    @ApiOperation({ summary: 'Logs a manager-user out', description: 'Logs a manager-user out' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user got logged out successfully.' })
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string): Promise<void> {
        return this.authenticationService.logout(refreshToken)
    }

    @ApiOperation({ summary: 'Refreshes the tokens', description: 'Refreshes the tokens for the session' })
    @ApiBody({ type: RefreshTokenRequestDto })
    @ApiResponse({ status: HttpStatus.OK, description: 'Tokens got refreshed successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An error occurred while refreshing tokens' })
    @HttpCode(HttpStatus.CREATED)
    @Post('refresh-tokens')
    refreshTokens(@Body('refreshToken') refreshToken: string): Promise<AuthenticationResponseDto> {
        return this.authenticationService.refreshTokens(refreshToken)
    }
}
