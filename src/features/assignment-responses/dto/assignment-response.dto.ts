import { IntersectionType, PartialType } from '@nestjs/mapped-types'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SimpleAssignmentDto } from 'src/features/assignments/dto/assignment.dto'
import { SimpleStudentDto } from 'src/features/students/dto/student.dto'
import { SearchQueryDto } from 'src/shared/dto/search.query.dto'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { AssignmentResponseState } from '../enums/assignment-response-state.enum'

export class AssignmentResponseDto {
    @ApiProperty({ required: true, type: String })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'id' }) })
    id: string

    @ApiProperty({ type: () => SimpleAssignmentDto })
    @ValidateNested()
    assignment: SimpleAssignmentDto

    @ApiProperty({ type: () => SimpleStudentDto })
    @ValidateNested()
    student: SimpleStudentDto

    @ApiProperty({ type: String, enum: AssignmentResponseState, required: true, default: AssignmentResponseState.inProgress })
    @IsEnum(AssignmentResponseState, {
        message: i18nValidationMessage('validation.enum', { property: 'state', values: AssignmentResponseState }),
    })
    status: AssignmentResponseState = AssignmentResponseState.inProgress

    @ApiProperty({ type: String })
    @IsOptional()
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'notes' }) })
    notes?: string

    @ApiProperty({ type: Number })
    @IsOptional()
    @IsNumber({}, { message: i18nValidationMessage('validation.number', { property: 'score' }) })
    score?: number

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsOptional()
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'startedAt' }) })
    startedAt?: Date

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsOptional()
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'submittedAt' }) })
    submittedAt?: Date

    @ApiProperty({ type: () => Object })
    @IsOptional()
    @IsObject()
    replies?: Record<string, unknown>

    @ApiProperty({ type: () => Object })
    @IsOptional()
    @IsObject()
    individualScores?: Record<string, number>
}

export class SearchAssignmentResponseQueryDto extends IntersectionType(
    PartialType(PickType(AssignmentResponseDto, ['id', 'startedAt', 'submittedAt'] as const)),
    SearchQueryDto
) {
    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'assignmentId' }) })
    assignmentId: string

    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'studentId' }) })
    studentId: string
}

export class PaginatedAssignmentResponseDto extends PaginatedDto<AssignmentResponseDto> {
    @ApiProperty({ type: [AssignmentResponseDto] })
    @ValidateNested({ each: true })
    @Type(() => AssignmentResponseDto)
    declare items: AssignmentResponseDto[]
}
