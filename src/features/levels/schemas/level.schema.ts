import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { CallbackWithoutResultAndOptionalError, HydratedDocument, Types } from 'mongoose'
import crypto from 'node:crypto'
import { SubjectInstance } from '../../subject-instances/schemas/subject-instance.schema'

export type LevelDocument = HydratedDocument<Level>

@Schema()
export class Level {
    @Prop({ required: true, unique: true, type: String })
    id: string

    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: true, type: Date })
    start: Date

    @Prop({ required: true, type: Date })
    end: Date

    @Prop({ required: true, type: Types.ObjectId, ref: 'SubjectInstance' })
    subjectInstance: SubjectInstance
}

export const LevelSchema = SchemaFactory.createForClass(Level)

LevelSchema.pre('save', function (next: CallbackWithoutResultAndOptionalError) {
    this.id = crypto.createHash('sha256').update(this._id.toString()).digest('hex')
    next()
})
