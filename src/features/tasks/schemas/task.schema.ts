import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'

export type TaskDocument = HydratedDocument<Task>

@Schema()
export class Task {
    @Prop({ required: true, type: Date })
    date: Date

    @Prop({ required: true, type: [ObjectId], ref: Lesson.name, default: [] })
    lessons: ObjectId[] | Populated<LessonDocument[]>
}

export const TaskSchema = SchemaFactory.createForClass(Task)

// Middleware to normalize date
TaskSchema.pre('save', function (next) {
    this.date = normalizeDate(this.date)
    next()
})
