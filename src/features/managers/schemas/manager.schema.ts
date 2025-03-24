import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Role } from '../../authentication/enums/role.enum'
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
    programs: ObjectId[] | Populated<ProgramDocument[]>

    @Prop({ required: true, type: [Types.ObjectId], ref: Subject.name, default: [] })
    subjects: ObjectId[] | Populated<SubjectDocument[]>
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)
