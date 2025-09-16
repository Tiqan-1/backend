import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { Assignment, AssignmentDocument } from 'src/features/assignments/schemas/assignment.schema'
import { Student, StudentDocument } from 'src/features/students/schemas/student.schema'
import { ObjectId } from '../../../shared/repository/types'
import { AssignmentResponseState } from '../enums/assignment-response-state.enum'

export type AssignmentResponseDocument = HydratedDocument<AssignmentResponse>

@Schema()
export class AssignmentResponse {
    @Prop({ required: false, type: String })
    notes?: string

    @Prop({ required: true, type: ObjectId, ref: Student.name })
    student: ObjectId | StudentDocument

    @Prop({ required: true, type: ObjectId, ref: Assignment.name })
    assignment: ObjectId | AssignmentDocument

    @Prop({ required: false, type: Number, default: 0 })
    score: number

    @Prop({ required: true, type: Date, default: Date.now() })
    startedAt: Date

    @Prop({ required: false, type: Date })
    submittedAt?: Date

    @Prop({
        required: true,
        type: String,
        enum: AssignmentResponseState,
        default: AssignmentResponseState.inProgress,
    })
    status: AssignmentResponseState

    @Prop({ type: Object, default: {} })
    replies: Record<string, unknown>

    @Prop({ type: Object, default: {} })
    individualScores: Record<string, number>
}

export const AssignmentResponseSchema = SchemaFactory.createForClass(AssignmentResponse)
