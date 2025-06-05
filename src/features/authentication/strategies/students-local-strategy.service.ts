import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { UserDocument } from '../../users/schemas/user.schema'
import { AuthenticationService } from '../authentication.service'

@Injectable()
export class StudentsLocalStrategy extends PassportStrategy(Strategy, 'students-local-strategy') {
    constructor(private readonly authenticationService: AuthenticationService) {
        super({ usernameField: 'email' })
    }

    async validate(email: string, password: string): Promise<UserDocument | undefined> {
        return await this.authenticationService.validateStudent(email, password)
    }
}
