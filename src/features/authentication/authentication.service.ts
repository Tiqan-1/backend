import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { Role } from '../../shared/enums/role.enum'
import { TokensService } from '../tokens/tokens.service'
import { UserDocument } from '../users/schemas/user.schema'
import { UsersService } from '../users/users.service'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly tokensService: TokensService
    ) {}

    login(userId: string) {
        return this.generateUserTokens(userId)
    }

    logout(refreshToken: string): Promise<void> {
        return this.tokensService.remove(refreshToken)
    }

    async refreshTokens(refreshToken: string): Promise<AuthenticationResponseDto> {
        const foundToken = await this.tokensService.findOne(refreshToken)
        if (!foundToken) {
            throw new UnauthorizedException('Invalid refresh token')
        }
        const newTokens = await this.generateUserTokens(foundToken.userId)
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

    private async generateUserTokens(userId: string): Promise<AuthenticationResponseDto> {
        try {
            const accessToken = this.jwtService.sign({ userId: userId })
            const refreshToken = uuidv4()

            await this.tokensService.create(refreshToken, userId)

            return {
                accessToken: accessToken,
                refreshToken: refreshToken,
            }
        } catch (error) {
            console.error('error while generating user tokens', error)
            throw new InternalServerErrorException('An unexpected error occurred')
        }
    }
}
