import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type VerificationCodeDocument = HydratedDocument<VerificationCode>

@Schema()
export class VerificationCode {
    @Prop({ required: true, unique: true, type: String })
    code: string

    @Prop({ required: true, unique: true, type: String })
    email: string

    @Prop({ required: true, unique: true, type: Date, index: { expireAfterSeconds: 0 } })
    expiresAt: Date
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode)
