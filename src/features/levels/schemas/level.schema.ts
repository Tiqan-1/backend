import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Task, TaskDocument } from '../../tasks/schemas/task.schema'

export type LevelDocument = HydratedDocument<Level>

@Schema()
export class Level {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: true, type: [Types.ObjectId], ref: Task.name })
    tasks: TaskDocument[]
}

export const LevelSchema = SchemaFactory.createForClass(Level)
