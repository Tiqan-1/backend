import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'

export class MessageDto {
    @ApiProperty({ required: true, type: String, description: 'message id' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'id' }) })
    id: string

    @ApiProperty({ required: true, type: Date, description: 'message creation date', example: Date.now() })
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'createdAt' }) })
    @Type(() => Date)
    createdAt: Date

    @ApiProperty({ required: false, type: Date, description: 'message last update date', example: Date.now() })
    @IsOptional()
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'updatedAt' }) })
    @Type(() => Date)
    updatedAt?: Date

    @ApiProperty({ required: true, type: String, description: 'message text' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'text' }) })
    text: string

    @ApiProperty({ required: true, type: () => SimpleManagerDto, description: 'message sender' })
    @ValidateNested()
    @Type(() => SimpleManagerDto)
    sender: SimpleManagerDto
}

export class MessageRequestDto {
    @ApiProperty({ required: true, type: String, description: 'new message' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'message' }) })
    message: string

    @ApiProperty({
        required: true,
        type: String,
        description: `the socket acquired from pusher after binding connected event.<br>
        Example: pusher.connection.bind("connected", () => socketId = pusher.connection.socket_id)<br>
        see: <a href="https://pusher.com/docs/channels/server_api/excluding-event-recipients/#solution">here</a>`,
    })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'socketId' }) })
    socketId: string
}
