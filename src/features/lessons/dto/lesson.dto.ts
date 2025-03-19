import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'
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

    @ApiProperty({ type: String, required: true, example: 'lessonId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'المحاضرة الأولى' })
    @IsString()
    title: string

    @ApiProperty({ type: String, enum: LessonType, required: true, example: LessonType.Video })
    @IsEnum(LessonType)
    type: LessonType

    @ApiProperty({ type: String, required: true, example: 'https://url.com' })
    @IsString()
    url: string
}

export class CreateLessonDto extends OmitType(LessonDto, ['id']) {}
