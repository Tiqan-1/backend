import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import * as crypto from 'node:crypto'
import { Program } from '../../programs/schemas/program.schema'

export type ManagerDocument = HydratedDocument<Manager>

@Schema()
export class Manager {
    @Prop({ unique: true, type: String })
    id: string

    @Prop({ required: true, type: String })
    name: string

    @Prop({ unique: true, required: true, type: String })
    email: string

    @Prop({ required: true, type: String })
    password: string

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Program', default: [] })
    programs: Program[]
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)

ManagerSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
