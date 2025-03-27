import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsOptional, IsString, ValidateNested } from 'class-validator'
import { arePopulated } from '../../../shared/helper/populated-type.helper'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { SubjectDocument } from '../schemas/subject.schema'

export class SubjectDto {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'الفقه' })
    @IsString()
    name: string

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, required: false, example: 'الفقه على المذهب الشافعي' })
    @IsString()
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
        return subjects.map(subject => new SubjectDto(subject))
    }
}

export class CreateSubjectDto extends OmitType(SubjectDto, ['id', 'lessons', 'createdBy'] as const) {}
