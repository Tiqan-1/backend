import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { ObjectId } from '../../../shared/repository/types'
import { TaskType } from '../enums'
import { TaskDocument } from '../schemas/task.schema'

export class TaskDto {
    @ApiProperty({ type: String, required: true, example: 'taskId' })
    @IsMongoId({ message: i18nValidationMessage('validation.string', { property: 'id' }) })
    id: string

    @ApiProperty({ type: String, required: true })
    @IsMongoId({ message: i18nValidationMessage('validation.string', { property: 'levelId' }) })
    @Type(() => ObjectId)
    levelId: ObjectId

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'date' }) })
    date: Date

    @ApiProperty({ type: String, required: true, enum: TaskType, default: 'lesson' })
    @IsEnum(TaskType, {
        message: i18nValidationMessage('validation.enum', { values: TaskType, property: 'type' }),
    })
    type: TaskType = TaskType.lesson

    @ApiProperty({ type: String, required: false, example: 'حتى الدقيقة 30:00' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'note' }) })
    @IsOptional()
    note?: string

    constructor(document: TaskDocument) {
        this.id = document._id.toString()
        this.levelId = document.levelId
        this.date = new Date(document.date)
        this.note = document.note
        this.type = document.type
    }

    static fromDocument(document: TaskDocument): TaskDto {
        return new TaskDto(document)
    }

    static fromDocuments(tasks: TaskDocument[] = []): TaskDto[] {
        return tasks.map(task => this.fromDocument(task)).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
}

export class CreateTaskDto extends OmitType(TaskDto, ['id', 'lessons', 'assignment'] as const) {
    @ApiProperty({ type: String, isArray: true, required: false })
    @IsOptional()
    @IsMongoId({ each: true, message: i18nValidationMessage('validation.mongoId', { property: 'lessonIds' }) })
    @Type(() => ObjectId)
    lessonIds?: ObjectId[]

    @ApiProperty({ type: String, required: true, enum: TaskType, default: 'lesson' })
    @IsEnum(TaskType, { message: i18nValidationMessage("validation.enum, { values: [TaskType], property: 'type' }") })
    type: TaskType = TaskType.lesson

    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId') })
    @Type(() => ObjectId)
    assignmentId?: ObjectId
}

export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['levelId'] as const)) {}

export class SearchTasksQueryDto extends IntersectionType(
    PartialType(
        OmitType(TaskDto, [
            'lessons',
            'chatRoomId',
            'assignment',
            'meetingLink',
            'minimumWatchTime',
            'wirdDetails',
            'wirdTitle',
        ] as const)
    ),
    SearchQueryDto
) {}
