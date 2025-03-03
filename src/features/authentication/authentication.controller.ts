import { Controller, Post, Request, UseGuards } from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { UserType } from '../users/types/user.type'
import { AuthenticationService } from './authentication.service'
import { LocalAuthGuard } from './local-auth.guard'

@Controller('authentication')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req: ExpressRequest) {
        if (req.user) {
            return this.authenticationService.login(req.user as UserType)
        }
    }

    /*@Post()
    refreshToken(@Param('refreshToken') refreshToken: string) {
        return this.authenticationService.refreshToken(refreshToken)
    }*/
}
