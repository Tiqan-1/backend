import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Chat, ChatDocument } from './schemas/chat.schema'

@Injectable()
export class ChatRepository extends RepositoryMongoBase<ChatDocument> {
    constructor(@InjectModel(Chat.name) model: Model<ChatDocument>) {
        super(model)
    }

    async findOne(filter: object): Promise<ChatDocument | undefined> {
        return super.findOne(filter, {
            populate: [
                {
                    path: 'messages',
                    populate: { path: 'sender', select: 'name email' },
                },
                {
                    path: 'createdBy',
                    select: 'name email',
                },
            ],
        })
    }
}
