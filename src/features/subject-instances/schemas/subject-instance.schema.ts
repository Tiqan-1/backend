import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import crypto from 'node:crypto'
import { Lesson, LessonSchema } from 'src/features/lessons/schemas/lesson.schema'
import { Subject } from '../../subjects/schemas/subject.schema'

export type SubjectInstanceDocument = HydratedDocument<SubjectInstance>

@Schema()
export class SubjectInstance {
    @Prop({ required: true, unique: true, type: String })
    id: string

    @Prop({ required: true, type: Types.ObjectId, ref: 'Subject' })
    subject: Subject

    @Prop(
        raw({
            type: Map,
            of: LessonSchema,
        })
    )
    lessonDates: Map<Date, Lesson>
}

export const SubjectInstanceSchema = SchemaFactory.createForClass(SubjectInstance)

SubjectInstanceSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
