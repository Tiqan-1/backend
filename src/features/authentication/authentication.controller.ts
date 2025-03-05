import { Body, Controller, HttpCode, HttpStatus, InternalServerErrorException, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBasicAuth, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request as ExpressRequest } from 'express'
import { LocalAuthGuard } from '../../shared/guards/local-auth.guard'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { FindUserDto } from '../users/dto/find-user.dto'
import { UserDocument } from '../users/schemas/user.schema'
import { UsersService } from '../users/users.service'
import { AuthenticationService } from './authentication.service'
import { AuthenticationRequestDto } from './dto/authentication-request.dto'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'

@ApiTags('api/authentication')
@Controller('api/authentication')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly usersService: UsersService
    ) {}

    @ApiOperation({ summary: 'Signs a user up', description: 'Signs a user up and returns the created user.' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'The user got created successfully.', type: FindUserDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal error occurred while creating the user.' })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() createUserDto: CreateUserDto): Promise<FindUserDto> {
        return this.usersService.create(createUserDto)
    }

    @ApiOperation({
        summary: 'Logs a user in',
        description: 'Logs a user in and returns the tokens to be used in further calls.',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'The User logged in successfully.', type: AuthenticationResponseDto })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'An internal error occurred while logging the user in.',
    })
    @ApiBody({ type: AuthenticationRequestDto })
    @ApiBasicAuth()
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req: ExpressRequest): Promise<AuthenticationResponseDto> | undefined {
        if (req.user) {
            return this.authenticationService.login(req.user as UserDocument)
        }
        throw new InternalServerErrorException('User not found in session.')
    }

    @ApiOperation({ summary: 'Logs a user out', description: 'Logs a user out' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The user got logged out successfully.' })
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string): Promise<void> {
        return this.authenticationService.logout(refreshToken)
    }

    @ApiOperation({ summary: 'Refreshes the tokens', description: 'Refreshes the tokens for the session' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Tokens got refreshed successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An error occurred while refreshing tokens' })
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    @UseGuards(LocalAuthGuard)
    @Post('refresh-tokens')
    refreshTokens(@Body('refreshToken') refreshToken: string): Promise<AuthenticationResponseDto> {
        return this.authenticationService.refreshTokens(refreshToken)
    }
}
