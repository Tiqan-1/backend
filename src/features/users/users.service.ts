import { Injectable, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { CreateUserDto } from './dto/create-user.dto'
import { FindUserDto } from './dto/find-user.dto'
import { UserDocument } from './schemas/user.schema'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
    constructor(private userRepository: UsersRepository) {}

    async create(user: CreateUserDto): Promise<FindUserDto> {
        user.password = bcrypt.hashSync(user.password, 10)
        const createdUser = await this.userRepository.create(user)
        return new FindUserDto(createdUser)
    }

    async findAll(): Promise<FindUserDto[]> {
        const users = await this.userRepository.findAll()
        return users.map(user => new FindUserDto(user))
    }

    /**
     * Warning: should never return users to client using this function, because it returns the passwords!
     * @param email
     */
    findByEmail(email: string): Promise<UserDocument | undefined> {
        return this.userRepository.findOne({ email })
    }

    async remove(email: string): Promise<void> {
        const result = await this.userRepository.remove({ email })
        if (!result) {
            throw new NotFoundException('User does not exist')
        }
    }
}
