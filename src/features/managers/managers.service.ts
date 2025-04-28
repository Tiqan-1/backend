import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'

@Injectable()
export class ManagersService {
    private readonly logger = new Logger(ManagersService.name)

    constructor(
        private managersRepository: ManagersRepository,
        private authenticationService: AuthenticationService
    ) {}

    async create(manager: SignUpManagerDto): Promise<AuthenticationResponseDto> {
        const duplicate = await this.managersRepository.findOne({ email: manager.email })
        if (duplicate) {
            this.logger.error(`Manager signup attempt with duplicate email detected: ${duplicate.email}`)
            throw new ConflictException('A user with the same email already exists.')
        }
        try {
            manager.password = bcrypt.hashSync(manager.password, 10)
            const createdManager = await this.managersRepository.create(manager)
            return this.authenticationService.generateUserTokens(createdManager)
        } catch (error) {
            this.logger.error('General Error while creating manager.', error)
            throw new InternalServerErrorException('General Error while creating manager.')
        }
    }
}
