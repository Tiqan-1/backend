import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Level, LevelDocument } from '../../levels/schemas/level.schema'
import { Program, ProgramDocument } from '../../programs/schemas/program.schema'
import { StudentDocument } from '../../students/schemas/student.schema'
import { SubscriptionState } from '../enums/subscription-state.enum'

export type SubscriptionDocument = HydratedDocument<Subscription>

@Schema()
export class Subscription {
    @Prop({ required: true, type: ObjectId, ref: Program.name })
    program: ObjectId | Populated<ProgramDocument>

    /** @deprecated */
    @Prop({ required: false, type: ObjectId, ref: Level.name })
    level?: ObjectId | Populated<LevelDocument>

    @Prop({ required: true, type: ObjectId, ref: 'Student' })
    subscriber: ObjectId | Populated<StudentDocument>

    @Prop({ required: true, type: Date, default: new Date() })
    subscriptionDate: Date

    @Prop({ required: true, type: String, enum: SubscriptionState, default: SubscriptionState.active })
    state: SubscriptionState

    @Prop({ required: false, type: String })
    notes?: string

    @Prop({ type: Date, index: { expireAfterSeconds: 0 } })
    expireAt?: Date
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)
