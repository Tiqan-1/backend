import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'
import { Assignment, AssignmentDocument } from 'src/features/assignments/schemas/assignment.model'
import { Student, StudentDocument } from 'src/features/students/schemas/student.schema'
import { ObjectId } from '../../../shared/repository/types'
import { AssignmentResponseStatus } from '../enums/assignment-response-status.enum'

export type AssignmentResponseDocument = HydratedDocument<AssignmentResponse>

@Schema()
export class AssignmentResponse {
    @Prop({ required: false, type: String })
    notes?: string

    @Prop({ required: true, type: ObjectId, ref: Student.name })
    studentId: ObjectId | StudentDocument

    @Prop({ required: true, type: ObjectId, ref: Assignment.name })
    assignmentId: ObjectId | AssignmentDocument

    @Prop({ required: false, type: Number, default: 0 })
    score: number

    @Prop({ required: true, type: Date, default: Date.now() })
    startedAt: Date

    @Prop({ required: false, type: Date })
    submittedAt?: Date

    @Prop({
        required: true,
        type: String,
        enum: AssignmentResponseStatus,
        default: AssignmentResponseStatus.inProgress,
    })
    status: AssignmentResponseStatus

    @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed, default: {} })
    replies: Map<string, unknown>

    @Prop({ type: MongooseSchema.Types.Map, of: Number, default: {} })
    individualScores: Map<string, number>
}

export const AssignmentResponseSchema = SchemaFactory.createForClass(AssignmentResponse)
