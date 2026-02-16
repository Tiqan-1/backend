import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsMongoId, IsOptional, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { ObjectId } from '../../../shared/repository/types'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { LessonDocument } from '../../lessons/schemas/lesson.schema'
import { LessonTaskDocument } from '../schemas/lesson-task.schema'
import { TaskDto } from './task.dto'

export class LessonTaskDto extends TaskDto {
    @ApiProperty({
        type: LessonDto,
        isArray: true,
        required: false,
        description: 'The lessons for the task (required for Lesson Tasks)',
    })
    @ValidateNested({ each: true })
    lessons?: LessonDto[]

    @ApiProperty({
        type: Number,
        required: false,
        description: 'The minimum watch time for the lesson in minutes (required for Lesson tasks)',
    })
    minimumWatchTime?: number

    constructor(document: LessonTaskDocument) {
        super(document)
        this.lessons = document.lessons.map(lesson => LessonDto.fromDocument(lesson as LessonDocument))
        this.minimumWatchTime = document.minimumWatchTime
    }

    static fromDocument(document: LessonTaskDocument): LessonTaskDto {
        return new TaskDto(document)
    }

    static fromDocuments(tasks: LessonTaskDocument[] = []): LessonTaskDto[] {
        return tasks.map(task => this.fromDocument(task)).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
}

export class CreateLessonTaskDto extends OmitType(LessonTaskDto, ['lessons'] as const) {
    @ApiProperty({ type: String, isArray: true, required: true })
    @IsMongoId({ each: true, message: i18nValidationMessage('validation.mongoId', { property: 'lessonIds' }) })
    @Type(() => ObjectId)
    lessonIds: ObjectId[]
}

export class UpdateLessonTaskDto extends PartialType(OmitType(CreateLessonTaskDto, ['levelId'] as const)) {}
