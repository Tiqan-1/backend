import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'
import { Assignment, AssignmentDocument } from 'src/features/assignments/schemas/assignment.model'
import { Student, StudentDocument } from 'src/features/students/schemas/student.schema'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { AssignmentResponseStatus } from '../enums/assignment-response-status.enum'

export type AssignmentResponseDocument = HydratedDocument<AssignmentResponse>

@Schema()
export class AssignmentResponse {
    @Prop({ type: String })
    notes?: string

    @Prop({ required: true, type: ObjectId, ref: Student.name })
    studentId: ObjectId | Populated<StudentDocument>

    @Prop({ required: true, type: ObjectId, ref: Assignment.name })
    assignmentId: ObjectId | Populated<AssignmentDocument>

    @Prop({ type: Number })
    score: number

    @Prop({ required: true, type: Date })
    startedAt: Date

    @Prop({ type: Date })
    submittedAt: Date

    @Prop({
        required: true,
        type: String,
        enum: AssignmentResponseStatus,
        default: AssignmentResponseStatus.IN_PROGRESS,
    })
    status: AssignmentResponseStatus

    @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed })
    replies: Map<string, unknown>

    @Prop({ type: MongooseSchema.Types.Map, of: Number, default: {} })
    individualScores: Map<string, number>
}

export const AssignmentResponseSchema = SchemaFactory.createForClass(AssignmentResponse)
