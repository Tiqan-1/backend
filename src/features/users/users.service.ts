import { Injectable, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { CreateUserDto } from './dto/create-user.dto'
import { FindUserDto } from './dto/find-user.dto'
import { UserDocument } from './schemas/user-schema'
import { UsersRepository } from './users-repository'

@Injectable()
export class UsersService {
    constructor(private userRepository: UsersRepository) {}

    async create(user: CreateUserDto): Promise<void> {
        return this.userRepository.create(user)
    }

    async findAll(): Promise<FindUserDto[]> {
        const users = await this.userRepository.findAll()
        return users.map(user => plainToInstance(FindUserDto, user))
    }

    async findOne(email: string): Promise<UserDocument | undefined> {
        const user = await this.userRepository.findOne({ email })
        if (!user) {
            throw new NotFoundException('User does not exist')
        }
        return user
    }

    async remove(email: string): Promise<void> {
        const result = await this.userRepository.remove({ email })
        if (!result) {
            throw new NotFoundException('User does not exist')
        }
    }
}
