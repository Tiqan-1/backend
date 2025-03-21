import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { Populated } from '../../../shared/repository/types'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'

export type TaskDocument = HydratedDocument<Task>

@Schema()
export class Task {
    @Prop({ required: true, type: Date })
    date: Date

    @Prop({ required: true, type: [Types.ObjectId], ref: Lesson.name })
    lessons: Types.ObjectId[] | Populated<LessonDocument[]>
}

export const TaskSchema = SchemaFactory.createForClass(Task)

// Middleware to normalize date
TaskSchema.pre('save', function (next) {
    this.date = normalizeDate(this.date)
    next()
})

export function areLessonsPopulated(
    lessons: Populated<LessonDocument[]> | Types.ObjectId[]
): lessons is Populated<LessonDocument[]> {
    return Array.isArray(lessons) && typeof lessons[0] !== 'string'
}
