import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Manager, ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type OralExamTaskDocument = HydratedDocument<OralExamTask>

@Schema()
export class OralExamTask {
    createdBy: ObjectId | Populated<ManagerDocument>
    createdAt: Date
    levelId: ObjectId
    date: Date
    type: TaskType
    note?: string
    expireAt?: Date
    state: TaskState

    @Prop({ required: true, type: String })
    url: string
    @Prop({ required: true, type: ObjectId, ref: Manager.name })
    teacher: ObjectId
}

export const OralExamTaskSchema = SchemaFactory.createForClass(OralExamTask)
