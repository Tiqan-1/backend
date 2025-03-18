import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Role } from '../../../shared/enums/role.enum'
import { Program, ProgramDocument } from '../../programs/schemas/program.schema'
import { Subject, SubjectDocument } from '../../subjects/schemas/subject.schema'

export type ManagerDocument = HydratedDocument<Manager>

@Schema()
export class Manager {
    name: string
    email: string
    password: string
    role: Role

    @Prop({ required: true, type: [Types.ObjectId], ref: Program.name, default: [] })
    programs: ProgramDocument[]

    @Prop({ required: true, type: [Types.ObjectId], ref: Subject.name, default: [] })
    subjects: SubjectDocument[]
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)
