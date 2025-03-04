import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { LocalAuthGuard } from '../../shared/guards/local-auth.guard'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { FindUserDto } from '../users/dto/find-user.dto'
import { UserDocument } from '../users/schemas/user.schema'
import { UsersService } from '../users/users.service'
import { AuthenticationService } from './authentication.service'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'

@Controller('authentication')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly usersService: UsersService
    ) {}

    @Post('signUp')
    signUp(@Body() createUserDto: CreateUserDto): Promise<FindUserDto> {
        return this.usersService.create(createUserDto)
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req: ExpressRequest): Promise<AuthenticationResponseDto> | undefined {
        if (req.user) {
            return this.authenticationService.login(req.user as UserDocument)
        }
    }

    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string): Promise<void> {
        return this.authenticationService.logout(refreshToken)
    }

    @Post('refresh-tokens')
    refreshTokens(@Body('refreshToken') refreshToken: string) {
        return this.authenticationService.refreshTokens(refreshToken)
    }
}
