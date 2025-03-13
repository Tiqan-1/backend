import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Program } from '../../programs/schemas/program.schema'
import { Subject } from '../../subjects/schemas/subject.schema'

export type ManagerDocument = HydratedDocument<Manager>

@Schema()
export class Manager {
    id: string
    name: string
    email: string
    password: string

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Program', default: [] })
    programs: Program[]

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Subject', default: [] })
    subjects: Subject[]
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)
