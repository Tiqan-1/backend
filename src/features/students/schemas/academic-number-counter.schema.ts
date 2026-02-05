import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AcademicNumberCounterDocument = HydratedDocument<AcademicNumberCounter>

@Schema()
export class AcademicNumberCounter {
    @Prop({ required: true, unique: true })
    name: string

    @Prop({ required: true, default: 0 })
    seq: number
}

export const AcademicNumberCounterSchema = SchemaFactory.createForClass(AcademicNumberCounter)
