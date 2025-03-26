import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Level, LevelDocument } from '../../levels/schemas/level.schema'
import { Program, ProgramDocument } from '../../programs/schemas/program.schema'
import { State } from '../enums/state.enum'

export type SubscriptionDocument = HydratedDocument<Subscription>

@Schema()
export class Subscription {
    @Prop({ required: true, type: ObjectId, ref: Program.name })
    program: ObjectId | Populated<ProgramDocument>

    @Prop({ required: true, type: ObjectId, ref: Level.name })
    level: ObjectId | Populated<LevelDocument>

    @Prop({ required: true, type: Date, default: new Date() })
    subscriptionDate: Date

    @Prop({ required: true, type: String, enum: State, default: State.active })
    state: State
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)
