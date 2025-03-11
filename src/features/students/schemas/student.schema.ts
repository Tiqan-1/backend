import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Role } from '../../../shared/enums/role.enum'
import { Subscription } from '../../subscriptions/schemas/subscription.schema'
import { Gender } from '../enums/gender'

export type StudentDocument = HydratedDocument<Student>

@Schema()
export class Student {
    id: string
    name: string
    email: string
    password: string
    role: Role

    @Prop({ required: true, enum: [Gender.male, Gender.female], type: String })
    gender: Gender

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Subscription', default: [] })
    subscriptions: Subscription[]
}

export const StudentSchema = SchemaFactory.createForClass(Student)
