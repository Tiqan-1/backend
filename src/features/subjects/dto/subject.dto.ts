import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsOptional, IsString, ValidateNested } from 'class-validator'
import { Types } from 'mongoose'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { simpleManagerDto } from '../../managers/dto/manager.dto'
import { SubjectDocument } from '../schemas/subject.schema'

export class SubjectDto {
    constructor(subject: SubjectDocument) {
        this.id = subject._id.toString()
        this.name = subject.name
        this.description = subject.description
        this.createdBy = new simpleManagerDto(subject.createdBy)
        this.lessons = subject.lessons.map(lesson => new LessonDto(lesson))
    }

    static fromDocument(subject: SubjectDocument): SubjectDto {
        return new SubjectDto(subject)
    }

    static fromDocuments(subjects: SubjectDocument[]): SubjectDto[] {
        return subjects.map(subject => new SubjectDto(subject))
    }

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
}

export class CreateSubjectDto extends OmitType(SubjectDto, ['id', 'lessons', 'createdBy'] as const) {
    static toDocument(subject: CreateSubjectDto, managerId: Types.ObjectId): unknown {
        return {
            ...subject,
            createdBy: managerId,
            lessons: subject.lessonIds?.map(lessonId => new Types.ObjectId(lessonId)),
        }
    }

    @ApiProperty({ type: String, isArray: true, required: true })
    @IsString({ each: true })
    @IsOptional()
    lessonIds?: string[]
}
