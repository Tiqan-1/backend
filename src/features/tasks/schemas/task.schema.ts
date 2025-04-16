import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { TaskState } from '../enums'

export type TaskDocument = HydratedDocument<Task>

@Schema()
export class Task {
    @Prop({ required: true, type: Date })
    date: Date

    @Prop({ required: true, type: [ObjectId], ref: Lesson.name, default: [] })
    lessons: ObjectId[] | Populated<LessonDocument[]>

    @Prop({ required: false, type: String })
    note?: string

    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date

    @Prop({ required: true, type: String, enum: TaskState, default: TaskState.active })
    state: TaskState
}

export const TaskSchema = SchemaFactory.createForClass(Task)

// Middleware to normalize date
TaskSchema.pre('save', function (next) {
    this.date = normalizeDate(this.date)
    next()
})
