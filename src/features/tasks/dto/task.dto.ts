import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsDate, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { ObjectId } from '../../../shared/repository/types'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { LessonDocument } from '../../lessons/schemas/lesson.schema'
import { TaskDocument } from '../schemas/task.schema'

export class TaskDto {
    @ApiProperty({ type: String, required: true, example: 'taskId' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true })
    @IsMongoId()
    levelId: string

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @Type(() => Date)
    @IsDate()
    date: Date

    @ApiProperty({ type: LessonDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    lessons: LessonDto[]

    @ApiProperty({ type: String, required: false, example: 'حتى الدقيقة 30:00' })
    @IsString()
    @IsOptional()
    note?: string

    @ApiProperty({ type: String, required: false, description: 'The chat room id for the task' })
    @IsString()
    @IsOptional()
    chatRoomId?: string

    constructor(document: TaskDocument) {
        this.id = document._id.toString()
        this.levelId = document.levelId.toString()
        this.date = new Date(document.date)
        this.note = document.note
        this.lessons = document.lessons.map(lesson => LessonDto.fromDocument(lesson as LessonDocument))
        this.chatRoomId = document.chatRoomId?.toString()
    }

    static fromDocument(document: TaskDocument): TaskDto {
        return new TaskDto(document)
    }

    static fromDocuments(tasks: TaskDocument[] = []): TaskDto[] {
        return tasks.map(task => this.fromDocument(task)).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
}

export class CreateTaskDto extends OmitType(TaskDto, ['id', 'lessons'] as const) {
    @ApiProperty({ type: String, isArray: true, required: false })
    @IsOptional()
    @IsMongoId({ each: true })
    @ArrayNotEmpty()
    lessonIds?: string[]

    @ApiProperty({ type: Boolean, required: false, description: 'Whether the task has a chat room', default: false })
    @IsOptional()
    hasChatRoom?: boolean

    @ApiProperty({ type: String, required: true, enum: ['lesson', 'assignment'], default: 'lesson' })
    @IsEnum(['lesson', 'assignment'], { message: i18nValidationMessage('validation.enum') })
    type: 'lesson' | 'assignment' = 'lesson'

    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId') })
    @Type(() => ObjectId)
    assignmentId: ObjectId
}

export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['levelId'] as const)) {}

export class SearchTasksQueryDto extends IntersectionType(
    PartialType(OmitType(TaskDto, ['lessons', 'chatRoomId'] as const)),
    SearchQueryDto
) {}
