import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Level, LevelDocument } from '../../levels/schemas/level.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { ProgramState } from '../enums/program-state.enum'

export type ProgramDocument = HydratedDocument<Program>

@Schema()
export class Program {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: String })
    description: string

    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>

    @Prop({ required: true, type: String, enum: ProgramState, default: ProgramState.created })
    state: ProgramState

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: false, type: Date })
    registrationStart?: Date

    @Prop({ required: false, type: Date })
    registrationEnd?: Date

    @Prop({ required: true, type: [ObjectId], ref: Level.name, default: [] })
    levels: ObjectId[] | Populated<LevelDocument[]>
}

export const ProgramSchema = SchemaFactory.createForClass(Program)
