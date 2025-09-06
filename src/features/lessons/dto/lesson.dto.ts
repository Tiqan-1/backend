import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { LessonType } from '../enums/lesson-type.enum'
import { LessonDocument } from '../schemas/lesson.schema'

export class LessonDto {
    constructor(lesson: LessonDocument) {
        this.id = lesson._id.toString()
        this.title = lesson.title
        this.type = lesson.type
        this.url = lesson.url
    }

    static fromDocument(lessonDocument: LessonDocument): LessonDto {
        return new LessonDto(lessonDocument)
    }

    static fromDocuments(lessonDocuments: LessonDocument[]): LessonDto[] {
        return lessonDocuments.map(document => this.fromDocument(document))
    }

    @ApiProperty({ type: String, required: true, example: 'lessonId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'id' }) })
    id: string

    @ApiProperty({ type: String, required: true, example: 'المحاضرة الأولى' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'title' }) })
    title: string

    @ApiProperty({ type: String, enum: LessonType, required: true, example: LessonType.video })
    @IsEnum(LessonType, {
        message: i18nValidationMessage('validation.enum', { property: 'type', values: Object.values(LessonType) }),
    })
    type: LessonType

    @ApiProperty({ type: String, required: true, example: 'https://url.com' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'url' }) })
    url: string
}

export class CreateLessonDto extends OmitType(LessonDto, ['id'] as const) {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'subjectId' }) })
    subjectId: string
}

export class UpdateLessonDto extends PartialType(OmitType(CreateLessonDto, ['subjectId'] as const)) {}

export class SearchLessonsQueryDto extends IntersectionType(PartialType(LessonDto), SearchQueryDto) {
    @ApiProperty({ type: String, required: false, example: 'subjectId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'subjectId' }) })
    @IsOptional()
    subjectId?: string
}
