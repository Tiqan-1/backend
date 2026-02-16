import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type WirdTaskDocument = HydratedDocument<WirdTask>

@Schema()
export class WirdTask {
    createdBy: ObjectId | Populated<ManagerDocument>
    createdAt: Date
    levelId: ObjectId
    date: Date
    type: TaskType
    note?: string
    expireAt?: Date
    state: TaskState

    @Prop({ required: false, type: String })
    wirdTitle?: string
    @Prop({ required: false, type: String })
    wirdDetails?: string
}

export const WirdTaskSchema = SchemaFactory.createForClass(WirdTask)
