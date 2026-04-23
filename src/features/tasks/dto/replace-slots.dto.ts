import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { CreateOralTestSlotDto } from './oral-test-slot.dto'

export class ReplaceSlotsDto {
    @ApiProperty({ type: [CreateOralTestSlotDto], required: true })
    @IsArray({ message: i18nValidationMessage('validation.array', { property: 'slots' }) })
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => CreateOralTestSlotDto)
    slots: CreateOralTestSlotDto[]
}
