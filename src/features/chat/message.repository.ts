import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Message, MessageDocument } from './schemas/message.schema'

@Injectable()
export class MessageRepository extends RepositoryMongoBase<MessageDocument> {
    constructor(@InjectModel(Message.name) model: Model<MessageDocument>) {
        super(model)
    }
}
