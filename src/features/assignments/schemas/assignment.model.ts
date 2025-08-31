import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { Level, LevelDocument } from 'src/features/levels/schemas/level.schema'
import { AssignmentState, AssignmentType } from '../enums/assignment-state.enum' 
import { Subject, SubjectDocument } from 'src/features/subjects/schemas/subject.schema'
import { ManagerDocument } from 'src/features/managers/schemas/manager.schema'
import { AssignmentForm, AssignmentFormSchema } from './assignment-form.schema'
import { AssignmentGradingState } from '../enums/assignment-grading-state.enum'

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

    @Prop({ type: String, enum: AssignmentGradingState, default: AssignmentGradingState.PENDING })
    gradingState: AssignmentGradingState;

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
    form: object;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment)
