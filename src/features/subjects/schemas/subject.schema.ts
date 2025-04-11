import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { SubjectState } from '../enums/subject-state'

export type SubjectDocument = HydratedDocument<Subject>

@Schema()
export class Subject {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: false, type: String })
    description?: string

    @Prop({ required: true, type: String, enum: SubjectState, default: SubjectState.active })
    state?: SubjectState

    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>

    @Prop({ required: true, type: [ObjectId], ref: Lesson.name })
    lessons: ObjectId[] | Populated<LessonDocument[]>
}

export const SubjectSchema = SchemaFactory.createForClass(Subject)
