import { SimpleAssignmentDto } from 'src/features/assignments/dto/assignment.dto'
import { AssignmentDocument } from 'src/features/assignments/schemas/assignment.schema'
import { SimpleStudentDto } from 'src/features/students/dto/student.dto'
import { StudentDocument } from 'src/features/students/schemas/student.schema'
import { AssignmentResponseDocument } from '../schemas/assignment-response.schema'
import { AssignmentResponseDto } from './assignment-response.dto'

export class AssignmentResponseMapping {
    static fromDocuments(foundAssignmentResponses: AssignmentResponseDocument[] = []): AssignmentResponseDto[] {
        return foundAssignmentResponses.map(document => this.fromDocument(document))
    }

    static fromDocument(document: AssignmentResponseDocument, hideScores = false): AssignmentResponseDto {
        return {
            id: document._id.toString(),
            student: SimpleStudentDto.fromDocument(document.student as StudentDocument),
            assignment: SimpleAssignmentDto.fromDocument(document.assignment as AssignmentDocument),
            status: document.status,
            score: hideScores ? undefined : document.score,
            notes: hideScores ? undefined : document.notes,
            individualScores: hideScores ? undefined : document.individualScores,
            startedAt: document.startedAt,
            submittedAt: document.submittedAt,
            replies: document.replies,
        }
    }
}
