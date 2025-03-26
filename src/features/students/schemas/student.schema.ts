import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Role } from '../../authentication/enums/role.enum'
import { Subscription, SubscriptionDocument } from '../../subscriptions/schemas/subscription.schema'
import { Gender } from '../enums/gender'

export type StudentDocument = HydratedDocument<Student>

@Schema()
export class Student {
    name: string
    email: string
    password: string
    role: Role

    @Prop({ required: true, enum: [Gender.male, Gender.female], type: String })
    gender: Gender

    @Prop({ required: true, type: [ObjectId], ref: Subscription.name, default: [] })
    subscriptions: ObjectId[] | Populated<SubscriptionDocument[]>
}

export const StudentSchema = SchemaFactory.createForClass(Student)
