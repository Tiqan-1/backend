import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
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
    private readonly logger = new Logger(AuthenticationService.name)

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
            this.logger.error(`Failed to logout user. Token not found.`)
            throw new NotFoundException('invalid refresh token')
        }
    }

    async refreshTokens(refreshToken: string): Promise<AuthenticationResponseDto> {
        const foundToken = await this.tokensService.findOne(refreshToken)
        if (!foundToken) {
            this.logger.error(`Failed to refresh token. Token not found.`)
            throw new UnauthorizedException('Invalid refresh token.')
        }
        const newTokens = await this.generateUserTokens(foundToken.user)
        await this.tokensService.remove(refreshToken)
        return newTokens
    }

    async validateStudent(email: string, password: string): Promise<UserDocument | undefined> {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. User Not Found.`)
            return undefined
        }
        if (!bcrypt.compareSync(password, user.password)) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. Password mismatch.`)
            return undefined
        }
        if (user.role !== Role.Student) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. Invalid role.`)
            return undefined
        }
        return user
    }

    async validateManager(email: string, password: string): Promise<UserDocument | undefined> {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. User Not Found.`)
            return undefined
        }
        if (!bcrypt.compareSync(password, user.password)) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. Password mismatch.`)
            return undefined
        }
        if (user.role !== Role.Manager) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. Invalid role.`)
            return undefined
        }
        return user
    }

    async generateUserTokens(user: UserDocument): Promise<AuthenticationResponseDto> {
        try {
            const accessToken = this.jwtService.sign({ id: user._id, role: user.role })
            const refreshToken = uuidv4()

            await this.tokensService.create(refreshToken, user)

            return {
                name: user.name,
                email: user.email,
                accessToken: accessToken,
                refreshToken: refreshToken,
            }
        } catch (error) {
            this.logger.error('General Error while generating user tokens.', error)
            throw new InternalServerErrorException('General Error while generating user tokens.')
        }
    }
}
