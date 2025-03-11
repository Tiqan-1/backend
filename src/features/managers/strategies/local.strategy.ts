import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { StudentDocument } from '../../students/schemas/student.schema'
import { ManagersService } from '../managers.service'
import { ManagerDocument } from '../schemas/manager.schema'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly managersService: ManagersService) {
        super({ usernameField: 'email' })
    }

    async validate(email: string, password: string): Promise<ManagerDocument | StudentDocument | undefined> {
        const user = await this.managersService.validateUser(email, password)
        if (!user) {
            throw new UnauthorizedException()
        }
        return user
    }
}
