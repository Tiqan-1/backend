import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type LessonTaskDocument = HydratedDocument<LessonTask>

@Schema()
export class LessonTask {
    createdBy: ObjectId | Populated<ManagerDocument>
    createdAt: Date
    levelId: ObjectId
    date: Date
    type: TaskType
    note?: string
    expireAt?: Date
    state: TaskState

    @Prop({ required: true, type: [ObjectId], ref: Lesson.name, default: [] })
    lessons: ObjectId[] | Populated<LessonDocument[]>
    @Prop({ required: false, type: Number, min: 0 })
    minimumWatchTime?: number
}

export const LessonTaskSchema = SchemaFactory.createForClass(LessonTask)
