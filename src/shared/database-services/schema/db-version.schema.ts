import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DbVersionDocument = HydratedDocument<DbVersion>

@Schema()
export class DbVersion {
    @Prop({ required: true, type: Number, default: 1 })
    version: number
}

export const DbVersionSchema = SchemaFactory.createForClass(DbVersion)
