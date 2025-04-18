import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { Subject } from '../../subjects/schemas/subject.schema'
import { LessonState } from '../enums/lesson-state.enum'
import { LessonType } from '../enums/lesson-type.enum'

export type LessonDocument = HydratedDocument<Lesson>

@Schema()
export class Lesson {
    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>

    @Prop({ required: true, type: ObjectId, ref: Subject.name })
    subjectId: ObjectId

    @Prop({ required: true, type: String })
    title: string

    @Prop({ required: true, type: String, enum: LessonType })
    type: LessonType

    @Prop({ required: true, type: String })
    url: string

    @Prop({ required: true, type: String, enum: LessonState, default: LessonState.active })
    state: LessonState
}
export const LessonSchema = SchemaFactory.createForClass(Lesson)
