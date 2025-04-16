import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { ArrayNotEmpty, IsDateString, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { LessonDocument } from '../../lessons/schemas/lesson.schema'
import { TaskDocument } from '../schemas/task.schema'

export class TaskDto {
    @ApiProperty({ type: String, required: true, example: 'taskId' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
    date: Date

    @ApiProperty({ type: LessonDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    lessons: LessonDto[]

    @ApiProperty({ type: String, required: false, example: 'حتى الدقيقة 30:00' })
    @IsString()
    @IsOptional()
    note?: string

    constructor(document: TaskDocument) {
        this.id = document._id.toString()
        this.date = new Date(document.date)
        this.note = document.note
        this.lessons = document.lessons.map(lesson => LessonDto.fromDocument(lesson as LessonDocument))
    }

    static fromDocument(document: TaskDocument): TaskDto {
        return new TaskDto(document)
    }

    static fromDocuments(tasks: TaskDocument[] = []): TaskDto[] {
        return tasks.map(task => this.fromDocument(task)).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
}

export class CreateTaskDto extends OmitType(TaskDto, ['id', 'lessons']) {
    @ApiProperty({ type: String, isArray: true, required: false })
    @IsOptional()
    @IsMongoId({ each: true })
    @ArrayNotEmpty()
    lessonIds?: string[]
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
