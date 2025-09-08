import { ApiProperty, IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsInt, IsMongoId, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { SimpleManagerDto } from 'src/features/managers/dto/manager.dto'
import { SubjectDto } from 'src/features/subjects/dto/subject.dto'
import { SubjectDocument } from 'src/features/subjects/schemas/subject.schema'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { ObjectId } from '../../../shared/repository/types'
import { LevelDto } from '../../levels/dto/level.dto'
import { LevelDocument } from '../../levels/schemas/level.schema'
import { AssignmentGradingState } from '../enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from '../enums/assignment-state.enum'
import { AssignmentDocument } from '../schemas/assignment.model'

const now = normalizeDate(new Date())

export class SimpleSubjectDto extends PickType(SubjectDto, ['id', 'name']) {
    constructor(doc: SubjectDocument) {
        super()
        this.id = doc._id.toString()
        this.name = doc.name
    }

    static fromDocument(createdBy: SubjectDocument): SimpleSubjectDto {
        return {
            id: createdBy._id.toString(),
            name: createdBy.name,
        }
    }
}
export class SimpleLevelDto extends PickType(LevelDto, ['id', 'name']) {
    constructor(doc: LevelDocument) {
        super()
        this.id = doc._id.toString()
        this.name = doc.name
    }

    static fromDocument(createdBy: LevelDocument): SimpleLevelDto {
        return {
            id: createdBy._id.toString(),
            name: createdBy.name,
        }
    }
}

export class AssignmentDto {
    @ApiProperty({ type: String })
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true })
    @IsString()
    title: string

    @ApiProperty({ type: String, required: true })
    @IsMongoId()
    levelId: string

    @ApiProperty({ type: () => SimpleLevelDto })
    @ValidateNested()
    level: SimpleLevelDto

    @ApiProperty({ type: String })
    @IsMongoId()
    subjectId: string

    @ApiProperty({ type: () => SimpleSubjectDto })
    @ValidateNested()
    subject: SimpleSubjectDto

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, enum: AssignmentState, required: true, default: AssignmentState.draft })
    @IsEnum(AssignmentState)
    state: AssignmentState

    @ApiProperty({ type: String, enum: AssignmentGradingState, required: true, default: AssignmentGradingState.pending })
    @IsEnum(AssignmentGradingState)
    gradingState: AssignmentGradingState

    @ApiProperty({ type: String, enum: AssignmentType, required: true, default: AssignmentType.exam })
    @IsEnum(AssignmentType)
    type: AssignmentType

    @ApiProperty({ type: Number, default: 0 })
    @IsInt()
    durationInMinutes: number

    @ApiProperty({ type: Number, required: true })
    passingScore: number

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate()
    availableFrom: Date
    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate()
    availableUntil: Date

    @ApiProperty({ type: () => Object })
    @IsObject()
    @IsOptional()
    form: object

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsDate()
    createdAt: Date

    @ApiProperty({ type: Date })
    @Type(() => Date)
    @IsDate()
    updatedAt: Date
}

export class PaginatedAssignmentDto extends PaginatedDto<AssignmentDto> {
    @ApiProperty({ type: [AssignmentDto] })
    @ValidateNested({ each: true })
    @Type(() => AssignmentDto)
    declare items: AssignmentDto[]
}

export class SimpleAssignmentDto extends PickType(AssignmentDto, ['title']) {
    static fromDocument(subscriber: AssignmentDocument): SimpleAssignmentDto {
        return {
            title: subscriber.title,
        }
    }
}

export class CreateAssignmentDto extends OmitType(AssignmentDto, [
    'id',
    'gradingState',
    'state',
    'createdBy',
    'subject',
    'level',
    'createdAt',
    'updatedAt',
] as const) {
    static toDocument(dto: CreateAssignmentDto, createdBy: ObjectId): object {
        return {
            createdBy: createdBy,
            title: dto.title,
            type: dto.type,
            levelId: dto.levelId,
            subjectId: dto.subjectId,
            durationInMinutes: dto.durationInMinutes,
            passingScore: dto.passingScore,
            availableFrom: dto.availableFrom,
            availableUntil: dto.availableUntil,
            form: dto.form ?? {},
        }
    }
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
    @ApiProperty({ type: String, enum: AssignmentState, required: false })
    @IsOptional()
    @IsEnum(AssignmentState)
    state?: AssignmentState

    static toDocument(dto: UpdateAssignmentDto): object {
        return {
            form: dto.form,
            title: dto.title,
            type: dto.type,
            state: dto.state,
            levelId: dto.levelId,
            subjectId: dto.subjectId,
            durationInMinutes: dto.durationInMinutes,
            passingScore: dto.passingScore,
            availableFrom: dto.availableFrom,
            availableUntil: dto.availableUntil,
        }
    }
}

export class SearchAssignmentQueryDto extends IntersectionType(
    PartialType(OmitType(AssignmentDto, ['form', 'subject', 'level', 'createdBy'] as const)),
    SearchQueryDto
) {}

export class SearchStudentAssignmentQueryDto extends OmitType(SearchAssignmentQueryDto, ['state'] as const) {
    @ApiProperty({
        type: String,
        required: false,
        enum: [AssignmentState.published, AssignmentState.closed],
    })
    @IsOptional()
    state: unknown = { $in: [AssignmentState.published, AssignmentState.closed] }
}
