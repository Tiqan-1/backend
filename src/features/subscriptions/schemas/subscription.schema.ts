import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Level } from '../../levels/schemas/level.schema'
import { Program } from '../../programs/schemas/program.schema'
import { State } from '../enums/state.enum'

export type SubscriptionDocument = HydratedDocument<Subscription>

@Schema()
export class Subscription {
    @Prop({ required: true, type: Types.ObjectId, ref: Program.name })
    program: Program

    @Prop({ required: true, type: Types.ObjectId, ref: Level.name })
    level: Level

    @Prop({ required: true, type: Date })
    subscriptionDate: Date

    @Prop({ required: true, type: String, enum: State })
    state: State
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)
