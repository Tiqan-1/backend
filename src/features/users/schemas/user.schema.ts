import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Role } from '../../authentication/enums/role.enum'
import { UserStatus } from '../enums/user-status'

export type UserDocument = HydratedDocument<User>

@Schema({ discriminatorKey: 'role' })
export class User {
    @Prop({ required: true })
    name: string

    @Prop({ unique: true, required: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop({ required: true, type: String, enum: Role })
    role: Role

    @Prop({ required: true, enum: UserStatus, type: String, default: UserStatus.active })
    status: UserStatus
}

export const UserSchema = SchemaFactory.createForClass(User)
