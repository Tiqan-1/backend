import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { MeetingTaskDocument } from '../schemas/meeting-task.schema'
import { TaskDto } from './task.dto'

export class MeetingTaskDto extends TaskDto {
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

    constructor(document: MeetingTaskDocument) {
        super(document)
        this.meetingLink = document.meetingLink
        this.chatRoomId = document.chatRoomId?.toString()
        this.hasChatRoom = !!document.chatRoomId
    }

    static fromDocument(document: MeetingTaskDocument): MeetingTaskDto {
        return new MeetingTaskDto(document)
    }

    static fromDocuments(documents: MeetingTaskDocument[]): MeetingTaskDto[] {
        return documents.map(document => MeetingTaskDto.fromDocument(document))
    }
}
