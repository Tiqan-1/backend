import { Injectable, NotFoundException } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { ObjectId } from '../../shared/repository/types'
import { FindUserDto } from './dto/find-user.dto'
import { UserDocument } from './schemas/user.schema'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
    constructor(
        private userRepository: UsersRepository,
        private readonly i18n: I18nService
    ) {}

    async findAll(): Promise<FindUserDto[]> {
        const users = await this.userRepository.findAll()
        return users.map(user => new FindUserDto(user))
    }

    /**
     * Warning: should never return users to client using this function, because it returns the passwords!
     * @param id
     */
    findById(id: ObjectId): Promise<UserDocument | undefined> {
        return this.userRepository.findById(id)
    }

    /**
     * Warning: should never return users to client using this function, because it returns the passwords!
     * @param email
     */
    findByEmail(email: string): Promise<UserDocument | undefined> {
        return this.userRepository.findOne({ email })
    }

    async updatePassword(email: string, password: string): Promise<void> {
        await this.userRepository.update({ email }, { password })
    }

    async remove(email: string): Promise<void> {
        const result = await this.userRepository.remove({ email })
        if (!result) {
            throw new NotFoundException(this.i18n.t('users.errors.notFound'))
        }
    }
}
