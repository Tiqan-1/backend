import { InternalServerErrorException } from '@nestjs/common'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsOptional, IsString, ValidateNested } from 'class-validator'
import { areNotPopulated } from '../../../shared/helper/populated-type.helper'
import { ObjectId } from '../../../shared/repository/types'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { simpleManagerDto } from '../../managers/dto/manager.dto'
import { SubjectDocument } from '../schemas/subject.schema'

export class SubjectDto {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'الفقه' })
    @IsString()
    name: string

    @ApiProperty({ type: () => simpleManagerDto, required: true })
    @ValidateNested()
    createdBy: simpleManagerDto

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
        this.createdBy = new simpleManagerDto(subject.createdBy)
        if (areNotPopulated(subject.lessons)) {
            throw new InternalServerErrorException()
        }
        this.lessons = subject.lessons.map(lesson => new LessonDto(lesson))
    }

    static fromDocument(subject: SubjectDocument): SubjectDto {
        return new SubjectDto(subject)
    }

    static fromDocuments(subjects: SubjectDocument[]): SubjectDto[] {
        return subjects.map(subject => new SubjectDto(subject))
    }
}

export class CreateSubjectDto extends OmitType(SubjectDto, ['id', 'lessons', 'createdBy'] as const) {
    @ApiProperty({ type: String, isArray: true, required: false })
    @IsString({ each: true })
    @IsOptional()
    lessonIds?: string[]

    static toDocument(subject: CreateSubjectDto, managerId: ObjectId): unknown {
        return {
            ...subject,
            createdBy: managerId,
            lessons: subject.lessonIds?.map(lessonId => new ObjectId(lessonId)),
        }
    }
}
