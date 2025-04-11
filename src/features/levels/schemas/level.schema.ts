import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Task, TaskDocument } from '../../tasks/schemas/task.schema'
import { LevelState } from '../enums/level-stats.enum'

export type LevelDocument = HydratedDocument<Level>

@Schema()
export class Level {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: true, type: [ObjectId], ref: Task.name, default: [] })
    tasks: ObjectId[] | Populated<TaskDocument[]>

    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date

    @Prop({ required: true, type: String, enum: LevelState, default: LevelState.active })
    state: LevelState
}

export const LevelSchema = SchemaFactory.createForClass(Level)
