import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { AssignmentDocument } from '../../assignments/schemas/assignment.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskState, TaskType } from '../enums'

export type AssignmentTaskDocument = HydratedDocument<AssignmentTask>

@Schema()
export class AssignmentTask {
    createdBy: ObjectId | Populated<ManagerDocument>
    createdAt: Date
    levelId: ObjectId
    date: Date
    type: TaskType
    note?: string
    expireAt?: Date
    state: TaskState

    @Prop({ required: false, type: ObjectId, ref: 'Assignment' })
    assignment?: ObjectId | AssignmentDocument
}

export const AssignmentTaskSchema = SchemaFactory.createForClass(AssignmentTask)
