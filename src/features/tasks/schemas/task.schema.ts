import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { AssignmentDocument } from '../../assignments/schemas/assignment.schema'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { StudentDocument } from '../../students/schemas/student.schema'
import { TaskState, TaskType } from '../enums'

export type TaskDocument = HydratedDocument<Task>
export type LessonTaskDocument = HydratedDocument<LessonTask>
export type AssignmentTaskDocument = HydratedDocument<AssignmentTask>
export type MeetingTaskDocument = HydratedDocument<MeetingTask>
export type WirdTaskDocument = HydratedDocument<WirdTask>
export type OralTestTaskDocument = HydratedDocument<OralTestTask>
export type AnyTaskDocument =
    | LessonTaskDocument
    | AssignmentTaskDocument
    | MeetingTaskDocument
    | WirdTaskDocument
    | OralTestTaskDocument

@Schema({ discriminatorKey: 'type' })
export class Task {
    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>
    @Prop({ required: true, type: Date, default: Date.now })
    createdAt: Date
    @Prop({ required: true, type: ObjectId, ref: 'Level' })
    levelId: ObjectId
    @Prop({ required: true, type: Date })
    date: Date
    @Prop({ required: true, type: String, enum: TaskType })
    type: TaskType
    @Prop({ required: false, type: String })
    note?: string
    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date
    @Prop({ required: true, type: String, enum: TaskState, default: TaskState.active })
    state: TaskState
}

@Schema()
export class LessonTask extends Task {
    declare type: TaskType.lesson
    @Prop({ required: true, type: [ObjectId], ref: Lesson.name, default: [] })
    lessons: ObjectId[] | Populated<LessonDocument[]>
    @Prop({ required: false, type: Number, min: 0 })
    minimumWatchTime?: number
}

@Schema()
export class AssignmentTask extends Task {
    declare type: TaskType.assignment
    @Prop({ required: false, type: ObjectId, ref: 'Assignment' })
    assignment?: ObjectId | AssignmentDocument
}

@Schema()
export class MeetingTask extends Task {
    declare type: TaskType.meeting
    @Prop({ required: false, type: String })
    meetingLink?: string
    @Prop({ required: false, type: ObjectId, ref: 'Chat' })
    chatRoomId?: ObjectId
}

@Schema()
export class WirdTask extends Task {
    declare type: TaskType.wird
    @Prop({ required: false, type: String })
    wirdTitle?: string
    @Prop({ required: false, type: String })
    wirdDetails?: string
}

@Schema({ _id: true })
export class OralTestSlot {
    _id: ObjectId
    @Prop({ required: true, type: Date })
    startsAt: Date
    @Prop({ required: true, type: Number, min: 5, max: 240 })
    durationMinutes: number

    @Prop({ required: false, type: ObjectId, ref: 'Student' })
    bookedBy?: ObjectId | Populated<StudentDocument>
    @Prop({ required: false, type: Date })
    bookedAt?: Date
    @Prop({ required: false, type: ObjectId, ref: 'Subscription' })
    bookedSubscriptionId?: ObjectId

    @Prop({ required: false, type: ObjectId, ref: 'Manager' })
    cancelledBy?: ObjectId
    @Prop({ required: false, type: Date })
    cancelledAt?: Date
    @Prop({ required: false, type: String })
    cancellationReason?: string

    @Prop({ required: false, type: Number, min: 0, max: 100 })
    grade?: number
    @Prop({ required: false, type: String })
    feedback?: string
    @Prop({ required: false, type: Date })
    gradedAt?: Date
}

export const OralTestSlotSchema = SchemaFactory.createForClass(OralTestSlot)

@Schema()
export class OralTestTask extends Task {
    declare type: TaskType.oralTest
    @Prop({ required: true, type: String })
    title: string
    @Prop({ required: false, type: String })
    description?: string
    @Prop({ required: false, type: String })
    meetingLink?: string
    @Prop({ required: true, type: [OralTestSlotSchema], default: [] })
    slots: OralTestSlot[]
}

export const TaskSchema = SchemaFactory.createForClass(Task)
export const LessonTaskSchema = SchemaFactory.createForClass(LessonTask)
LessonTaskSchema.remove('type')
export const AssignmentTaskSchema = SchemaFactory.createForClass(AssignmentTask)
AssignmentTaskSchema.remove('type')
export const MeetingTaskSchema = SchemaFactory.createForClass(MeetingTask)
MeetingTaskSchema.remove('type')
export const WirdTaskSchema = SchemaFactory.createForClass(WirdTask)
WirdTaskSchema.remove('type')
export const OralTestTaskSchema = SchemaFactory.createForClass(OralTestTask)
OralTestTaskSchema.remove('type')
