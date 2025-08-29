import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '../../../shared/repository/types'
import { UserDocument } from '../../users/schemas/user.schema'

export type MessageDocument = HydratedDocument<Message>

@Schema()
export class Message {
    @Prop({ required: true, type: Date, default: Date.now() })
    createdAt: Date
    @Prop({ required: false, type: Date })
    updatedAt?: Date
    @Prop({ required: true, type: String })
    text: string
    @Prop({ required: true, type: ObjectId, ref: 'Chat' })
    chatRoomId: ObjectId
    @Prop({ required: true, type: ObjectId, ref: 'User' })
    sender: UserDocument
}

export const MessageSchema = SchemaFactory.createForClass(Message)
