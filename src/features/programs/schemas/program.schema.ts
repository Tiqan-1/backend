import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import crypto from 'node:crypto'
import { Level } from '../../levels/schemas/level.schema'

export type ProgramDocument = HydratedDocument<Program>

@Schema()
export class Program {
    @Prop({ required: true, unique: true, type: String })
    id: string

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

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Level', default: [] })
    levels: Level[]
}

export const ProgramSchema = SchemaFactory.createForClass(Program)

ProgramSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
