import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import { Lesson, LessonDocument } from '../../lessons/schemas/lesson.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'

export type SubjectDocument = HydratedDocument<Subject>

@Schema()
export class Subject {
    @Prop({ required: true, type: String })
    name: string

    @Prop({ required: false, type: String })
    description?: string

    @Prop({ required: true, type: Types.ObjectId, ref: 'Manager' })
    createdBy: ManagerDocument

    @Prop({ required: true, type: [Types.ObjectId], ref: Lesson.name })
    lessons: LessonDocument[]
}

export const SubjectSchema = SchemaFactory.createForClass(Subject)
