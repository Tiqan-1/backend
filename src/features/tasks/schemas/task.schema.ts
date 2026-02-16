import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type TaskDocument = HydratedDocument<Task>

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

export const TaskSchema = SchemaFactory.createForClass(Task)
