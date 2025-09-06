import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { arePopulated } from '../../../shared/helper/populated-type.helper'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { SubjectDocument } from '../schemas/subject.schema'

export class SubjectDto {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'id' }) })
    id: string

    @ApiProperty({ type: String, required: true, example: 'الفقه' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'name' }) })
    name: string

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, required: false, example: 'الفقه على المذهب الشافعي' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'description' }) })
    @IsOptional()
    description?: string

    @ApiProperty({ type: LessonDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    lessons: LessonDto[]

    constructor(subject: SubjectDocument) {
        this.id = subject._id.toString()
        this.name = subject.name
        this.description = subject.description
        this.createdBy = SimpleManagerDto.fromDocument(subject.createdBy as ManagerDocument)
        this.lessons = arePopulated(subject.lessons) ? subject.lessons.map(lesson => new LessonDto(lesson)) : []
    }

    static fromDocument(subject: SubjectDocument): SubjectDto {
        return new SubjectDto(subject)
    }

    static fromDocuments(subjects: SubjectDocument[] = []): SubjectDto[] {
        return subjects.map(subject => this.fromDocument(subject))
    }
}

export class CreateSubjectDto extends OmitType(SubjectDto, ['id', 'lessons', 'createdBy'] as const) {}

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export class SearchSubjectQueryDto extends IntersectionType(
    PartialType(OmitType(SubjectDto, ['createdBy', 'lessons'])),
    SearchQueryDto
) {}
