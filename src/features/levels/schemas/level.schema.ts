import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { SubjectInstance } from '../../subject-instances/schemas/subject-instance.schema'

export type LevelDocument = HydratedDocument<Level>

@Schema()
export class Level {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: true, type: Types.ObjectId, ref: SubjectInstance.name })
    subjectInstance: SubjectInstance
}

export const LevelSchema = SchemaFactory.createForClass(Level)
