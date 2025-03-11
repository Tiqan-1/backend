import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument } from 'mongoose'
import crypto from 'node:crypto'
import { LessonType } from '../enums/lesson-type.enum'

export type LessonDocument = HydratedDocument<Lesson>

@Schema()
export class Lesson {
    @Prop({ required: true, unique: true, type: String })
    id: string

    @Prop({ required: true, type: String })
    title: string

    @Prop({ required: true, type: String, enum: [LessonType.pdf, LessonType.other, LessonType.video] })
    Type: LessonType

    @Prop({ required: true, type: String })
    url: string
}
export const LessonSchema = SchemaFactory.createForClass(Lesson)

LessonSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
