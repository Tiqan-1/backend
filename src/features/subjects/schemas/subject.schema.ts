import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import crypto from 'node:crypto'
import { Lesson } from '../../lessons/schemas/lesson.schema'

export type SubjectDocument = HydratedDocument<Subject>

@Schema()
export class Subject {
    @Prop({ required: true, unique: true, type: String })
    id: string

    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: false, type: String })
    description?: string

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Lesson', default: [] })
    lessons: Lesson[]
}

export const SubjectSchema = SchemaFactory.createForClass(Subject)

SubjectSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
