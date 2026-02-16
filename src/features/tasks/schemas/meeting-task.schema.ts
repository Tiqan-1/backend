import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type MeetingTaskDocument = HydratedDocument<MeetingTask>

@Schema()
export class MeetingTask {
    createdBy: ObjectId | Populated<ManagerDocument>
    createdAt: Date
    levelId: ObjectId
    date: Date
    type: TaskType
    note?: string
    expireAt?: Date
    state: TaskState

    @Prop({ required: false, type: String })
    meetingLink?: string
    @Prop({ required: false, type: ObjectId, ref: 'Chat' })
    chatRoomId?: ObjectId
}

export const MeetingTaskSchema = SchemaFactory.createForClass(MeetingTask)
