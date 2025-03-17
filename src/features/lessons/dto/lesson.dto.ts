import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString } from 'class-validator'
import { LessonType } from '../enums/lesson-type.enum'

export class LessonDto {
    @ApiProperty({ type: String, required: true, example: 'lessonId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'المحاضرة الأولى' })
    @IsString()
    title: string

    @ApiProperty({ type: String, enum: LessonType, required: true, example: LessonType.Video })
    @IsEnum(LessonType)
    Type: LessonType

    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsString()
    url: string
}
