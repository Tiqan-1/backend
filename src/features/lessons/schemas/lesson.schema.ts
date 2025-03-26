import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { LessonType } from '../enums/lesson-type.enum'

export type LessonDocument = HydratedDocument<Lesson>

@Schema()
export class Lesson {
    @Prop({ required: true, type: String })
    title: string

    @Prop({ required: true, type: String, enum: LessonType })
    type: LessonType

    @Prop({ required: true, type: String })
    url: string
}
export const LessonSchema = SchemaFactory.createForClass(Lesson)
