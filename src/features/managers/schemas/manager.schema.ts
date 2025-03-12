import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Role } from '../../../shared/enums/role.enum'
import { Program } from '../../programs/schemas/program.schema'

export type ManagerDocument = HydratedDocument<Manager>

@Schema()
export class Manager {
    id: string
    name: string
    email: string
    password: string
    role: Role

    @Prop({ required: true, type: [Types.ObjectId], ref: 'Program', default: [] })
    programs: Program[]
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)
