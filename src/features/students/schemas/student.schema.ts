import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Model } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Role } from '../../authentication/enums/role.enum'
import { Subscription, SubscriptionDocument } from '../../subscriptions/schemas/subscription.schema'
import { UserStatus } from '../../users/enums/user-status'
import { Gender } from '../enums/gender'
import { AcademicNumberCounter, AcademicNumberCounterDocument } from './academic-number-counter.schema'

export type StudentDocument = HydratedDocument<Student>

@Schema()
export class Student {
    name: string
    email: string
    password: string
    role: Role
    status: UserStatus

    @Prop({ unique: true })
    academicNumber?: string

    @Prop({ required: true, enum: [Gender.male, Gender.female], type: String })
    gender: Gender

    @Prop({ required: true, type: [ObjectId], ref: Subscription.name, default: [] })
    subscriptions: ObjectId[] | Populated<SubscriptionDocument[]>

    @Prop({ required: false, type: String })
    profilePicture?: string

    @Prop({ required: true, type: Number })
    phoneNumber: string

    @Prop({ required: true, type: String })
    country: string

    @Prop({ required: true, type: Date })
    dateOfBirth: Date

    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date
}

export const StudentSchema = SchemaFactory.createForClass(Student)

StudentSchema.pre('save', async function (next) {
    if (!this.academicNumber) {
        const studentModel = this.constructor as Model<StudentDocument>
        const counterModel = studentModel.db.model<AcademicNumberCounterDocument>(AcademicNumberCounter.name)

        const counter = await counterModel.findOneAndUpdate(
            { name: 'academicNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )

        // Starting from 100000 to ensure 6 digits
        const startValue = 100000
        this.academicNumber = (startValue + counter.seq).toString()
    }
    next()
})
