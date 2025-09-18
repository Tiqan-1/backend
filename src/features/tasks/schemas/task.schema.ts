import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { AssignmentDocument } from '../../assignments/schemas/assignment.schema'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState } from '../enums'

export type TaskDocument = HydratedDocument<Task>

@Schema()
export class Task {
    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>

    @Prop({ required: true, type: ObjectId, ref: 'Level' })
    levelId: ObjectId

    @Prop({ required: true, type: Date })
    date: Date

    @Prop({ required: true, type: [ObjectId], ref: Lesson.name, default: [] })
    lessons: ObjectId[] | Populated<LessonDocument[]>

    @Prop({ required: false, type: ObjectId, ref: 'Assignment' })
    assignment?: ObjectId | AssignmentDocument

    @Prop({ required: true, type: String, enum: ['lesson', 'assignment'] })
    type: 'lesson' | 'assignment'

    @Prop({ required: false, type: String })
    note?: string

    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date

    @Prop({ required: true, type: String, enum: TaskState, default: TaskState.active })
    state: TaskState

    @Prop({ required: false, type: ObjectId, ref: 'Chat' })
    chatRoomId?: ObjectId
}

export const TaskSchema = SchemaFactory.createForClass(Task)

// Middleware to normalize date
TaskSchema.pre('save', function (next) {
    this.date = normalizeDate(this.date)
    next()
})
