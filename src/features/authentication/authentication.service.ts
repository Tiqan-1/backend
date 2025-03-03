import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { FindUserDto } from '../users/dto/find-user.dto'
import { UserType } from '../users/types/user.type'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}

    async validateUser(email: string, password: string): Promise<FindUserDto | undefined> {
        const user = await this.usersService.findOne(email)
        if (user && user.password == password) {
            return user
        }
        return undefined
    }

    login(user: UserType) {
        const payload = { email: user.email, sub: user }
        return {
            access_token: this.jwtService.sign(payload),
        }
    }
}
