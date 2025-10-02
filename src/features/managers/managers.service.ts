import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { I18nService } from 'nestjs-i18n'
import { EmailService } from '../../shared/email/email.service'
import { UserStatus } from '../users/enums/user-status'
import { UsersRepository } from '../users/users.repository'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'

@Injectable()
export class ManagersService {
    private readonly logger = new Logger(ManagersService.name)

    constructor(
        private managersRepository: ManagersRepository,
        private emailService: EmailService,
        private usersRepository: UsersRepository,
        private readonly i18n: I18nService
    ) {}

    async create(manager: SignUpManagerDto): Promise<void> {
        const duplicate = await this.usersRepository.findOne({ email: manager.email })
        if (duplicate) {
            this.logger.error(`Manager signup attempt with duplicate email detected: ${duplicate.email}`)
            throw new ConflictException(this.i18n.t('managers.errors.emailAlreadyExists'))
        }
        try {
            manager.password = bcrypt.hashSync(manager.password, 10)
            const createdManager = await this.managersRepository.create({ ...manager, status: UserStatus.inactive })
            await this.emailService.sendVerificationEmail(createdManager.email, createdManager._id.toString())
        } catch (error) {
            this.logger.error('General Error while creating manager.', error)
            throw new InternalServerErrorException(this.i18n.t('managers.errors.managerCreationError'))
        }
    }
}
