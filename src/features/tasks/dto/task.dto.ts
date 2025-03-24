import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsString, ValidateNested } from 'class-validator'
import { arePopulated } from '../../../shared/helper/populated-type.helper'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { TaskDocument } from '../schemas/task.schema'

export class TaskDto {
    @ApiProperty({ type: String, required: true, example: 'taskId' })
    @IsString()
    id: string

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
    date: Date

    @ApiProperty({ type: LessonDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    lessons: LessonDto[]

    constructor(document: TaskDocument) {
        this.id = document._id.toString()
        this.date = new Date(document.date)
        if (arePopulated(document.lessons)) {
            this.lessons = document.lessons.map(lesson => LessonDto.fromDocument(lesson))
        } else {
            console.warn('lessons were not populated')
            this.lessons = []
        }
    }

    static fromDocument(document: TaskDocument): TaskDto {
        return new TaskDto(document)
    }
}

export class CreateTaskDto extends OmitType(TaskDto, ['id', 'lessons']) {
    @ApiProperty({ type: String, isArray: true, required: true })
    @IsNotEmpty()
    @IsString({ each: true })
    lessonIds: string[]
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
