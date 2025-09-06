import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { MessageDto } from './message.dto'

export class ChatDto {
    @ApiProperty({ type: String, description: 'chat room id' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'id' }) })
    id: string

    @ApiProperty({ type: Date, description: 'chat room creation date', example: Date.now() })
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'createdAt' }) })
    @Type(() => Date)
    createdAt: Date

    @ApiProperty({ type: SimpleManagerDto, description: 'chat room creator' })
    @ValidateNested()
    @Type(() => SimpleManagerDto)
    createdBy: SimpleManagerDto

    @ApiProperty({ type: MessageDto, isArray: true, description: 'chat room messages' })
    @ValidateNested({ each: true })
    @Type(() => MessageDto)
    messages: MessageDto[]
}
