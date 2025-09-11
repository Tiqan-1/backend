import { IntersectionType, PartialType } from '@nestjs/mapped-types'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsInt, IsMongoId, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { SimpleAssignmentDto } from 'src/features/assignments/dto/assignment.dto'
import { SimpleStudentDto } from 'src/features/students/dto/student.dto'
import { SearchQueryDto } from 'src/shared/dto/search.query.dto'
import { AssignmentResponseStatus } from '../enums/assignment-response-status.enum'

export class AssignmentResponseDto {
    @ApiProperty({ required: true, type: String })
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true })
    @IsMongoId()
    assignmentId: string

    @ApiProperty({ type: () => SimpleAssignmentDto })
    @ValidateNested()
    assignment: SimpleAssignmentDto

    @ApiProperty({ type: String })
    @IsMongoId()
    studentId: string
    @ApiProperty({ type: () => SimpleStudentDto })
    @ValidateNested()
    student: SimpleStudentDto

    @ApiProperty({ type: String, enum: AssignmentResponseStatus, required: true, default: AssignmentResponseStatus.inProgress })
    @IsEnum(AssignmentResponseStatus)
    status: AssignmentResponseStatus

    @ApiProperty({ type: String })
    @IsString()
    notes?: string

    @ApiProperty({ type: Number })
    @IsInt()
    score?: number

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsOptional()
    @IsDate()
    startedAt: Date | undefined
    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsOptional()
    @IsDate()
    submittedAt: Date | undefined

    @ApiProperty({ type: () => Object })
    @IsObject()
    @IsOptional()
    replies: object

    @ApiProperty({ type: () => Object })
    @IsObject()
    @IsOptional()
    individualScores?: object
}

export class SearchAssignmentResponseQueryDto extends IntersectionType(
    PartialType(
        OmitType(AssignmentResponseDto, ['score', 'notes', 'replies', 'assignment', 'student', 'individualScores'] as const)
    ),
    SearchQueryDto
) {}
