import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '../../../shared/repository/types'
import { UserDocument } from '../../users/schemas/user.schema'
import { MessageDocument } from './message.schema'

export type ChatDocument = HydratedDocument<Chat>

@Schema()
export class Chat {
    @Prop({ required: true, type: Date, default: Date.now() })
    createdAt: Date
    @Prop({ required: true, type: ObjectId, ref: 'User' })
    createdBy: UserDocument
    @Prop({ required: true, type: [ObjectId], ref: 'Message', default: [] })
    messages: MessageDocument[]
}

export const ChatSchema = SchemaFactory.createForClass(Chat)
