import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsDate, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { ObjectId } from '../../../shared/repository/types'
import { AssignmentDto } from '../../assignments/dto/assignment.dto'
import { AssignmentDocument } from '../../assignments/schemas/assignment.schema'
import { LessonDto } from '../../lessons/dto/lesson.dto'
import { LessonDocument } from '../../lessons/schemas/lesson.schema'
import { TaskType } from '../enums'
import { AnyTaskDocument } from '../schemas/task.schema'
import { CreateOralTestSlotDto, OralTestSlotDto } from './oral-test-slot.dto'

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

    // for lessons
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

    // for assignments
    @ApiProperty({
        type: AssignmentDto,
        required: false,
        description: 'The assignment for the task (required for Assignment Tasks)',
    })
    @IsOptional()
    assignment?: AssignmentDto

    // for meetings
    @ApiProperty({ type: String, required: false, description: 'The meeting link for the task (required for Meeting tasks)' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'meetingLink' }) })
    @IsOptional()
    meetingLink?: string
    @ApiProperty({ type: String, required: false, description: 'The chat room id for the task (only for Meeting tasks)' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'chatRoomId' }) })
    @IsOptional()
    chatRoomId?: string
    @ApiProperty({ type: Boolean, required: false, description: 'Whether the task has a chat room (only for Meeting tasks)' })
    @IsOptional()
    hasChatRoom?: boolean

    @ApiProperty({
        type: String,
        required: false,
        description: 'The wird title for the task (required for Wird tasks)',
        example: 'سورة آل عمران (1)',
    })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'wirdTitle' }) })
    @IsOptional()
    wirdTitle?: string

    @ApiProperty({
        type: String,
        required: false,
        description: 'The wird details for the task (required for Wird tasks)',
        example: 'صفحة 1',
    })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'wirdDetails' }) })
    @IsOptional()
    wirdDetails?: string

    // for oral tests (تسميع)
    @ApiProperty({ type: String, required: false, description: 'Oral test title (required for OralTest tasks)' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'title' }) })
    @IsOptional()
    title?: string

    @ApiProperty({ type: String, required: false, description: 'Oral test description (only for OralTest tasks)' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'description' }) })
    @IsOptional()
    description?: string

    @ApiProperty({
        type: [OralTestSlotDto],
        required: false,
        description: 'Time slots for the oral test (only for OralTest tasks). bookedBy is exposed only to the owner manager.',
    })
    @IsOptional()
    slots?: OralTestSlotDto[]

    constructor(document: AnyTaskDocument) {
        this.id = document._id.toString()
        this.levelId = document.levelId
        this.date = new Date(document.date)
        this.note = document.note
        this.type = document.type
        this.hasChatRoom = false

        if (document.type === TaskType.lesson) {
            this.lessons = document.lessons.map(lesson => LessonDto.fromDocument(lesson as LessonDocument))
            this.minimumWatchTime = document.minimumWatchTime
        } else if (document.type === TaskType.assignment) {
            this.assignment = document.assignment && AssignmentDto.fromDocument(document.assignment as AssignmentDocument)
        } else if (document.type === TaskType.meeting) {
            this.meetingLink = document.meetingLink
            this.chatRoomId = document.chatRoomId?.toString()
            this.hasChatRoom = !!document.chatRoomId
        } else if (document.type === TaskType.wird) {
            this.wirdTitle = document.wirdTitle
            this.wirdDetails = document.wirdDetails
        } else if (document.type === TaskType.oralTest) {
            this.title = document.title
            this.description = document.description
            this.meetingLink = document.meetingLink
            // default to manager-view shape; student-view shaping is done by listSlots when needed
            this.slots = document.slots.map(slot => OralTestSlotDto.fromDocument(slot, { exposeBookedBy: true }))
        }
    }

    static fromDocument(document: AnyTaskDocument): TaskDto {
        return new TaskDto(document)
    }

    static fromDocuments(tasks: AnyTaskDocument[] = []): TaskDto[] {
        return tasks.map(task => this.fromDocument(task)).sort((a, b) => a.date.getTime() - b.date.getTime())
    }
}

export class CreateTaskDto extends OmitType(TaskDto, ['id', 'lessons', 'assignment', 'slots'] as const) {
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

    @ApiProperty({
        type: [CreateOralTestSlotDto],
        required: false,
        description: 'Initial slots for an OralTest task (optional — slots can also be added later via /slots endpoints).',
    })
    @IsOptional()
    @IsArray({ message: i18nValidationMessage('validation.array', { property: 'initialSlots' }) })
    @ValidateNested({ each: true })
    @Type(() => CreateOralTestSlotDto)
    initialSlots?: CreateOralTestSlotDto[]
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
            'title',
            'description',
            'slots',
        ] as const)
    ),
    SearchQueryDto
) {}
