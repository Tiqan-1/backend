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

    async findOneRaw(filter: object): Promise<ChatDocument | undefined> {
        const found = await this.model.findOne(filter)
        if (!found) {
            return undefined
        }
        return found
    }

    async findOne(filter: object): Promise<ChatDocument | undefined> {
        const found = await this.model
            .findOne(filter)
            .populate({ path: 'messages', populate: { path: 'sender', select: 'name email' } })
            .populate('createdBy', 'name email')
        if (!found) {
            return undefined
        }
        return found
    }
}
