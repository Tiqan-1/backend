// import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger'
// import { Type } from 'class-transformer'
// import { IsDate, IsInt, IsMongoId, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
// import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
// import { normalizeDate } from '../../../shared/helper/date.helper'
// import { ObjectId } from '../../../shared/repository/types' 
// import { AssignmentResponseDto } from './assignment-response.dto'

// const now = normalizeDate(new Date())



// export class CreateAssignmentResponseDto extends OmitType(AssignmentResponseDto, [
//     'id', 'startedAt', 'submittedAt', 'studentId', 'score', 'notes', 'assignment', 'student'
// ] as const) {

//     static toDocument(dto: CreateAssignmentResponseDto, studentId: ObjectId): object { 
//         return {
//             startedAt: now,
//             studentId: studentId,
//             assignmentId: dto.assignmentId, 
//             replies: dto.replies ?? undefined,
//         }
//     }
// }

// export class UpdateAssignmentResponseDto extends OmitType(AssignmentResponseDto, [
//     'id', 'startedAt', 'submittedAt', 'studentId', 'assignmentId', 'assignment', 'student'
// ] as const) {

//     static toDocument(dto: UpdateAssignmentResponseDto): object {
//         return {
//             submittedAt: now,
//             score: dto.score,
//             notes: dto.notes,
//             replies: dto.replies,
//         }
//     }
// }

// export class SearchAssignmentResponseQueryDto extends IntersectionType(
//     PartialType(OmitType(AssignmentResponseDto, ['score', 'notes', 'replies', 'assignment', 'student', 'individualScores'] as const)),
//     SearchQueryDto
// ) {}

// export class SearchStudentAssignmentResponseQueryDto extends PickType(SearchAssignmentResponseQueryDto, ['assignmentId'] as const) {
// }
