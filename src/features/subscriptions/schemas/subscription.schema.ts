import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import * as crypto from 'node:crypto'
import { Level } from '../../levels/schemas/level.schema'
import { Program } from '../../programs/schemas/program.schema'
import { State } from '../enums/state.enum'

export type SubscriptionDocument = HydratedDocument<Subscription>

@Schema()
export class Subscription {
    @Prop({ unique: true, type: String })
    id: string

    @Prop({ required: true, type: Types.ObjectId, ref: 'Program' })
    program: Program

    @Prop({ required: true, type: Types.ObjectId, ref: 'Level' })
    level: Level

    @Prop({ required: true, type: Date })
    subscriptionDate: Date

    @Prop({ required: true, type: String, enum: ['ACTIVE', 'SUCCEEDED', 'FAILED', 'SUSPENDED'] })
    state: State
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)

SubscriptionSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
