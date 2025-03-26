import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '../../../shared/repository/types'
import { User, UserDocument } from '../../users/schemas/user.schema'

export type RefreshTokenDocument = HydratedDocument<RefreshToken>

@Schema()
export class RefreshToken {
    @Prop({ required: true, unique: true })
    token: string

    @Prop({ type: ObjectId, ref: User.name, required: true })
    user: UserDocument

    @Prop({ required: true, default: Date.now(), expires: '10d' })
    createdAt: Date
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)
