import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import crypto from 'node:crypto'
import { Subscription } from '../../subscriptions/schemas/subscription.schema'
import { Gender } from '../enums/gender'

export type StudentDocument = HydratedDocument<Student>

@Schema()
export class Student {
    @Prop({ required: true, unique: true, type: String })
    id: string

    @Prop({ required: true, type: String })
    name: string

    @Prop({ unique: true, required: true, type: String })
    email: string

    @Prop({ required: true, type: String })
    password: string

    @Prop({ required: true, enum: [Gender.male, Gender.female], type: String })
    gender: Gender

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Subscription', default: [] })
    subscriptions: Subscription[]
}

export const StudentSchema = SchemaFactory.createForClass(Student)

StudentSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
