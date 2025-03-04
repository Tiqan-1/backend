import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type RefreshTokenDocument = Document & RefreshToken

@Schema()
export class RefreshToken {
    @Prop({ required: true })
    token: string

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: Types.ObjectId

    @Prop({ required: true })
    expiryDate: Date

    @Prop({ required: true })
    lastUsedAt: Date
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)
