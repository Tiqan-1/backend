import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument } from 'mongoose'
import * as crypto from 'node:crypto'
import { Role } from '../../../shared/enums/role.enum'
import { Manager } from '../../managers/schemas/manager.schema'
import { Student } from '../../students/schemas/student.schema'

export type UserDocument = HydratedDocument<User>

@Schema({ discriminatorKey: 'role' })
export class User {
    @Prop({ unique: true, type: String })
    id: string

    @Prop({ required: true })
    name: string

    @Prop({ unique: true, required: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop({ required: true, type: String, enum: [Manager.name, Student.name] })
    role: Role
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
