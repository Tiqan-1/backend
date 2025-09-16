import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsInt, IsMongoId, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SimpleManagerDto } from 'src/features/managers/dto/manager.dto'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { SimpleLevelDto } from '../../levels/dto/level.dto'
import { SimpleSubjectDto } from '../../subjects/dto/subject.dto'
import { PopulatedAssignmentDocument } from '../assignments.repository'
import { AssignmentGradingState } from '../enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from '../enums/assignment-state.enum'
import { AssignmentDocument } from '../schemas/assignment.schema'

const now = normalizeDate(new Date())

export class AssignmentDto {
    @ApiProperty({ type: String })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'id' }) })
    id: string

    @ApiProperty({ type: String, required: true })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'title' }) })
    title: string

    @ApiProperty({ type: String, required: false })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'taskId' }) })
    taskId: string

    @ApiProperty({ type: SimpleSubjectDto, required: false, deprecated: true })
    @IsOptional()
    @ValidateNested()
    level?: SimpleLevelDto

    @ApiProperty({ type: SimpleSubjectDto, required: false, deprecated: true })
    @IsOptional()
    @ValidateNested()
    subject?: SimpleSubjectDto

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, enum: AssignmentState, required: true, default: AssignmentState.draft })
    @IsEnum(AssignmentState, {
        message: i18nValidationMessage('validation.enum', { property: 'state', values: AssignmentState }),
    })
    state: AssignmentState

    @ApiProperty({ type: String, enum: AssignmentGradingState, required: true, default: AssignmentGradingState.pending })
    @IsEnum(AssignmentGradingState, {
        message: i18nValidationMessage('validation.enum', { property: 'gradingState', values: AssignmentGradingState }),
    })
    gradingState: AssignmentGradingState

    @ApiProperty({ type: String, enum: AssignmentType, required: true, default: AssignmentType.exam })
    @IsEnum(AssignmentType, { message: i18nValidationMessage('validation.enum', { property: 'type', values: AssignmentType }) })
    type: AssignmentType

    @ApiProperty({ type: Number, default: 0 })
    @IsInt({ message: i18nValidationMessage('validation.number', { property: 'durationInMinutes' }) })
    durationInMinutes: number

    @ApiProperty({ type: Number, required: true })
    @IsNumber({}, { message: i18nValidationMessage('validation.number', { property: 'passingScore' }) })
    passingScore: number

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'availableFrom' }) })
    availableFrom: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'availableUntil' }) })
    availableUntil: Date

    @ApiProperty({ type: () => Object })
    @IsOptional()
    @IsObject()
    form?: object

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'createdAt' }) })
    createdAt: Date

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'updatedAt' }) })
    updatedAt: Date

    static fromDocuments(foundAssignments: PopulatedAssignmentDocument[] = []): AssignmentDto[] {
        return foundAssignments
            .map(document => this.fromDocument(document))
            .sort((a, b) => a.availableFrom.getTime() - b.availableFrom.getTime())
    }

    static fromDocument(document: PopulatedAssignmentDocument, withoutForm: boolean = false): AssignmentDto {
        return {
            id: document._id.toString(),
            title: document.title,
            createdBy: document.createdBy,
            taskId: document.taskId?.toString(),
            level: { name: 'level' },
            subject: { name: 'subject' },
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

export class PaginatedAssignmentDto extends PaginatedDto<AssignmentDto> {
    @ApiProperty({ type: [AssignmentDto] })
    @ValidateNested({ each: true })
    @Type(() => AssignmentDto)
    declare items: AssignmentDto[]
}

export class SimpleAssignmentDto extends PickType(AssignmentDto, ['title', 'id']) {
    static fromDocument(document: AssignmentDocument): SimpleAssignmentDto {
        return {
            title: document.title,
            id: document._id.toString(),
        }
    }
}

export class CreateAssignmentDto extends OmitType(AssignmentDto, [
    'id',
    'gradingState',
    'state',
    'createdBy',
    'createdAt',
    'updatedAt',
] as const) {}

const allowedUpdateStates = [AssignmentState.published, AssignmentState.canceled, AssignmentState.closed, AssignmentState.draft]
export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
    @ApiProperty({ type: String, enum: AssignmentState, required: false })
    @IsOptional()
    @IsEnum(allowedUpdateStates, { message: i18nValidationMessage('validation.enum', { enum: allowedUpdateStates }) })
    state?: AssignmentState
}

export class SearchAssignmentQueryDto extends IntersectionType(
    PartialType(OmitType(AssignmentDto, ['form', 'taskId', 'createdBy', 'updatedAt'] as const)),
    SearchQueryDto
) {}
