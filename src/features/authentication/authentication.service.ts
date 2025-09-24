import {
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotAcceptableException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'
import { I18nService } from 'nestjs-i18n'
import { v4 as uuidv4 } from 'uuid'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { EmailService } from '../../shared/email/email.service'
import { ObjectId } from '../../shared/repository/types'
import { TokensService } from '../tokens/tokens.service'
import { UserStatus } from '../users/enums/user-status'
import { UserDocument } from '../users/schemas/user.schema'
import { UsersService } from '../users/users.service'
import { AuthenticationResponseDto } from './dto/authentication-response.dto'
import { ChangePasswordRequestDto } from './dto/change-password-request.dto'
import { Role } from './enums/role.enum'
import { VerificationCodesRepository } from './verification-codes.repository'

@Injectable()
export class AuthenticationService {
    private readonly logger = new Logger(AuthenticationService.name)

    constructor(
        private readonly usersService: UsersService,
        private readonly documentsService: SharedDocumentsService,
        private readonly jwtService: JwtService,
        private readonly tokensService: TokensService,
        private readonly i18n: I18nService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly verificationCodeRepository: VerificationCodesRepository
    ) {}

    async verify(id: ObjectId): Promise<string> {
        const user = await this.usersService.findById(id)
        if (!user) {
            this.logger.error(`Failed to verify user. User not found.`)
            throw new NotFoundException(this.i18n.t('auth.errors.userNotFound'))
        }
        if (user.status !== UserStatus.inactive) {
            this.logger.error(`Failed to verify user. User is not in a verifiable state.`)
            throw new ConflictException(this.i18n.t('auth.errors.userNotVerifiable'))
        }
        user.status = UserStatus.active
        await user.save()
        this.logger.log(`User ${user.email} verified.`)
        if (user.role === Role.Student) {
            return this.configService.get('STUDENT_WEB_URL') + '#/login'
        }
        return this.configService.get('MANAGEMENT_WEB_URL') + '#/login'
    }

    async sendPasswordResetCode(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            this.logger.error(`Failed to send password reset code. User not found.`)
            throw new NotFoundException(this.i18n.t('auth.errors.userNotFound'))
        }
        if (user.status !== UserStatus.active) {
            this.logger.error(`Failed to send password reset code. User is not in an active state.`)
            throw new ConflictException(this.i18n.t('auth.errors.notActiveToResetPassword'))
        }
        const prevCode = await this.verificationCodeRepository.findOne({ email: user.email })
        if (prevCode) {
            await this.verificationCodeRepository.remove(prevCode._id)
        }
        const resetCode = uuidv4().substring(0, 8)
        await this.verificationCodeRepository.create({ email: user.email, code: resetCode, expiresAt: addDays(Date.now(), 1) })
        await this.emailService.sendResetPasswordEmail(user.email, resetCode)
        this.logger.log(`Password reset code sent to user ${user.email}.`)
    }

    async changePassword(dto: ChangePasswordRequestDto): Promise<void> {
        const verifyCode = await this.verificationCodeRepository.findOne({ email: dto.email, code: dto.code })
        if (!verifyCode) {
            throw new ForbiddenException(this.i18n.t('auth.errors.invalidCode'))
        }
        const newHashedPassword = bcrypt.hashSync(dto.password, 10)
        await this.usersService.updatePassword(dto.email, newHashedPassword)
        await this.verificationCodeRepository.remove({ email: dto.email })
        this.logger.log(`Password reset successfully for user ${dto.email}.`)
    }

    login(user: UserDocument): Promise<AuthenticationResponseDto> {
        return this.generateUserTokens(user)
    }

    async logout(refreshToken: string): Promise<void> {
        const success = await this.tokensService.remove(refreshToken)
        if (!success) {
            this.logger.error(`Failed to logout user. Token not found.`)
            throw new NotFoundException(this.i18n.t('auth.errors.invalidRefreshToken'))
        }
    }

    async refreshTokens(refreshToken: string): Promise<AuthenticationResponseDto> {
        const foundToken = await this.tokensService.findOne(refreshToken)
        if (!foundToken) {
            this.logger.error(`Failed to refresh token. Token not found.`)
            throw new UnauthorizedException(this.i18n.t('auth.errors.invalidRefreshToken'))
        }
        const newTokens = await this.generateUserTokens(foundToken.user)
        await this.tokensService.remove(refreshToken)
        return newTokens
    }

    async validateStudent(email: string, password: string): Promise<UserDocument> {
        const student = await this.documentsService.getStudentByEmail(email)
        if (!student) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. User Not Found.`)
            throw new UnauthorizedException(this.i18n.t('auth.errors.invalidCredentials'))
        }
        if (!bcrypt.compareSync(password, student.password)) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. Password mismatch.`)
            throw new UnauthorizedException(this.i18n.t('auth.errors.invalidCredentials'))
        }
        if (student.role !== Role.Student) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. Invalid role.`)
            throw new ConflictException(this.i18n.t('auth.errors.invalidRole'))
        }
        if (student.status !== UserStatus.active) {
            this.logger.error(`Invalid attempt to login a student user with email: ${email}. Invalid status ${student.status}.`)
            throw new NotAcceptableException(this.i18n.t('auth.errors.accountNotActive'))
        }
        return student
    }

    async validateManager(email: string, password: string): Promise<UserDocument> {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. User Not Found.`)
            throw new UnauthorizedException(this.i18n.t('auth.errors.invalidCredentials'))
        }
        if (!bcrypt.compareSync(password, user.password)) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. Password mismatch.`)
            throw new UnauthorizedException(this.i18n.t('auth.errors.invalidCredentials'))
        }
        if (user.role !== Role.Manager) {
            this.logger.error(`Invalid attempt to login a manager user with email: ${email}. Invalid role.`)
            throw new ConflictException(this.i18n.t('auth.errors.invalidRole'))
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
            throw new InternalServerErrorException(this.i18n.t('auth.errors.tokenGenerationError'))
        }
    }
}
