import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { ManagerDto, SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'

@Injectable()
export class ManagersService {
    constructor(private managersRepository: ManagersRepository) {}

    async create(manager: SignUpManagerDto): Promise<ManagerDto> {
        try {
            manager.password = bcrypt.hashSync(manager.password, 10)
            const createdManager = await this.managersRepository.create(manager)
            return new ManagerDto(createdManager)
        } catch (error) {
            console.error('error while creating manager', error)
            throw new InternalServerErrorException()
        }
    }
}
