import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Level } from '../../levels/schemas/level.schema'

export type ProgramDocument = HydratedDocument<Program>

@Schema()
export class Program {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: String })
    description: string

    @Prop({ required: false, type: [String], default: [] })
    goals: string[]

    @Prop({ required: true, type: Boolean })
    active: boolean

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: false, type: Date })
    registrationStart?: Date

    @Prop({ required: false, type: Date })
    registrationEnd?: Date

    @Prop({ required: true, type: [Types.ObjectId], ref: Level.name, default: [] })
    levels: Level[]
}

export const ProgramSchema = SchemaFactory.createForClass(Program)
