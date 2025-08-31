import { AssignmentResponseDocument } from "../schemas/assignment-response.schema"
import { AssignmentResponseDto } from "./assignment-response.dto"
import { StudentDocument } from "src/features/students/schemas/student.schema"
import { SimpleStudentDto } from "src/features/students/dto/student.dto"
import { SimpleAssignmentDto } from "src/features/assignments/dto/assignment.dto"
import { AssignmentDocument } from "src/features/assignments/schemas/assignment.model"

export class AssignmentResponseMapping {

    static fromDocuments(foundAssignmentResponses: AssignmentResponseDocument[] = []): AssignmentResponseDto[] {
        return foundAssignmentResponses.map(document => this.fromDocument(document))
    }

    static fromDocument(document: AssignmentResponseDocument): AssignmentResponseDto {
        return {
            id: document._id.toString(),
            studentId: document.studentId?._id?.toString?.(),
            assignmentId: document.assignmentId?._id?.toString?.(),
            student: SimpleStudentDto.fromDocument(document.studentId as StudentDocument),
            assignment: SimpleAssignmentDto.fromDocument(document.assignmentId as AssignmentDocument),
            status: document.status,
            score: document.score,
            notes: document.notes,
            startedAt: document.startedAt,
            submittedAt: document.submittedAt,
            replies: document.replies,
            individualScores: document.individualScores,
        }
    }
}