import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type RefreshTokenDocument = Document & RefreshToken

@Schema()
export class RefreshToken {
    @Prop({ required: true })
    token: string

    @Prop({ type: String, required: true })
    userId: string

    @Prop({ required: true })
    expiryDate: Date

    @Prop({ required: true })
    lastUsedAt: Date
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)
