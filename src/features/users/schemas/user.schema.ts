import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Role } from '../../authentication/enums/role.enum'

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
}

export const UserSchema = SchemaFactory.createForClass(User)
