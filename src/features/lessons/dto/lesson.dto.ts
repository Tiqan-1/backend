import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator'
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
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true, example: 'المحاضرة الأولى' })
    @IsString()
    title: string

    @ApiProperty({ type: String, enum: LessonType, required: true, example: LessonType.video })
    @IsEnum(LessonType)
    type: LessonType

    @ApiProperty({ type: String, required: true, example: 'https://url.com' })
    @IsString()
    url: string
}

export class CreateLessonDto extends OmitType(LessonDto, ['id'] as const) {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsMongoId()
    subjectId: string
}

export class UpdateLessonDto extends PartialType(OmitType(CreateLessonDto, ['subjectId'] as const)) {}

export class SearchLessonsQueryDto extends IntersectionType(PartialType(LessonDto), SearchQueryDto) {
    @ApiProperty({ type: String, required: false, example: 'subjectId' })
    @IsMongoId()
    @IsOptional()
    subjectId?: string
}
