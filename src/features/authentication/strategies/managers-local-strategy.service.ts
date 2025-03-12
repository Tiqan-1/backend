import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { UserDocument } from '../../users/schemas/user.schema'
import { AuthenticationService } from '../authentication.service'

@Injectable()
export class ManagersLocalStrategy extends PassportStrategy(Strategy, 'managers-local-strategy') {
    constructor(private readonly authenticationService: AuthenticationService) {
        super({ usernameField: 'email' })
    }

    async validate(email: string, password: string): Promise<UserDocument | undefined> {
        const user = await this.authenticationService.validateManager(email, password)
        if (!user) {
            throw new UnauthorizedException()
        }
        return user
    }
}
