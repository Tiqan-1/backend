import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Subject, SubjectDocument } from 'src/features/subjects/schemas/subject.schema'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Level, LevelDocument } from '../../levels/schemas/level.schema'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { AssignmentGradingState } from '../enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from '../enums/assignment-state.enum'
import { AssignmentForm, AssignmentFormDocument } from './assignment-form.schema'

export type AssignmentDocument = HydratedDocument<Assignment>

@Schema()
export class Assignment {
    @Prop({ required: true, type: String })
    title: string

    @Prop({ required: true, type: ObjectId, ref: 'Manager' })
    createdBy: ObjectId | Populated<ManagerDocument>

    @Prop({ required: true, type: ObjectId, ref: Level.name })
    levelId: ObjectId | Populated<LevelDocument>

    @Prop({ type: ObjectId, ref: Subject.name })
    subjectId: ObjectId | Populated<SubjectDocument>

    @Prop({ type: String, enum: AssignmentGradingState, default: AssignmentGradingState.pending })
    gradingState: AssignmentGradingState

    @Prop({ required: true, type: String, enum: AssignmentState, default: AssignmentState.draft })
    state: AssignmentState

    @Prop({ required: true, type: String, enum: AssignmentType, default: AssignmentType.exam })
    type: AssignmentType

    @Prop({ required: false, type: Number })
    durationInMinutes: number

    @Prop({ required: false, type: Number })
    passingScore: number

    @Prop({ required: true, type: Date })
    availableFrom: Date

    @Prop({ required: true, type: Date })
    availableUntil: Date

    @Prop({ required: true, type: Date })
    createdAt: Date

    @Prop({ required: true, type: Date })
    updatedAt: Date

    // @Prop({ required: true, type: AssignmentFormSchema })
    // form: AssignmentForm;
    @Prop({ required: true, type: Object })
    form: AssignmentFormDocument
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment)
