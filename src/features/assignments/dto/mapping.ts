import { SimpleManagerDto } from "src/features/managers/dto/manager.dto"
import { AssignmentDocument } from "../schemas/assignment.model"
import { AssignmentDto, SimpleLevelDto, SimpleSubjectDto } from "./assignment.dto"
import { LevelDocument } from "src/features/levels/schemas/level.schema"
import { SubjectDocument } from "src/features/subjects/schemas/subject.schema"
import { ManagerDocument } from "src/features/managers/schemas/manager.schema"

export class AssignmentMapping {
    static fromDocuments(foundAssignments: AssignmentDocument[] = []): AssignmentDto[] {
        return foundAssignments.map(document => this.fromDocument(document)).sort((a, b) => a.availableFrom.getTime() - b.availableFrom.getTime())
    }

    static  fromDocument(document: AssignmentDocument, withoutForm: boolean = false): AssignmentDto {
        return {
            id: document._id.toString(),
            title: document.title,
            levelId: document.levelId?.id,
            subjectId: document.subjectId?.id,
            level: SimpleLevelDto.fromDocument(document.levelId as LevelDocument),
            subject: SimpleSubjectDto.fromDocument(document.subjectId as SubjectDocument),
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            state: document.state,
            gradingState: document.gradingState,
            type: document.type,
            durationInMinutes: document.durationInMinutes,
            availableFrom: document.availableFrom,
            availableUntil: document.availableUntil,
            passingScore: document.passingScore,
            form: withoutForm ? {} : document.form,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        }
    }
}