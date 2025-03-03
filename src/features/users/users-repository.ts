import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { CreateUserDto } from './dto/create-user.dto'
import { User, UserDocument } from './schemas/user-schema'

@Injectable()
export class UsersRepository extends RepositoryMongoBase<UserDocument, CreateUserDto> {
    constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
        super(userModel)
    }
}
