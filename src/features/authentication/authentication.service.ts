import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { TokensService } from '../tokens/tokens.service'
import { UserDocument } from '../users/schemas/user.schema'
import { UsersService } from '../users/users.service'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'
import { Role } from './enums/role.enum'

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly tokensService: TokensService
    ) {}

    login(user: UserDocument): Promise<AuthenticationResponseDto> {
        return this.generateUserTokens(user)
    }

    async logout(refreshToken: string): Promise<void> {
        const success = await this.tokensService.remove(refreshToken)
        if (!success) {
            throw new NotFoundException('invalid refresh token')
        }
    }

    async refreshTokens(refreshToken: string): Promise<AuthenticationResponseDto> {
        const foundToken = await this.tokensService.findOne(refreshToken)
        if (!foundToken) {
            throw new UnauthorizedException('Invalid refresh token')
        }
        const newTokens = await this.generateUserTokens(foundToken.user)
        await this.tokensService.remove(refreshToken)
        return newTokens
    }

    async validateStudent(email: string, password: string): Promise<UserDocument | undefined> {
        const user = await this.usersService.findByEmail(email)
        if (user && bcrypt.compareSync(password, user.password) && user.role === Role.Student) {
            return user
        }
        return undefined
    }

    async validateManager(email: string, password: string): Promise<UserDocument | undefined> {
        const user = await this.usersService.findByEmail(email)
        if (user && bcrypt.compareSync(password, user.password) && user.role === Role.Manager) {
            return user
        }
        return undefined
    }

    private async generateUserTokens(user: UserDocument): Promise<AuthenticationResponseDto> {
        try {
            const accessToken = this.jwtService.sign({ id: user._id, role: user.role })
            const refreshToken = uuidv4()

            await this.tokensService.create(refreshToken, user)

            return {
                accessToken: accessToken,
                refreshToken: refreshToken,
            }
        } catch (error) {
            console.error('General Error while generating user tokens.', error)
            throw new InternalServerErrorException('General Error while generating user tokens.')
        }
    }
}
