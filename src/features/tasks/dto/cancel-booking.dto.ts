import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CancelBookingDto {
    @ApiProperty({ type: String, required: false, description: 'Optional reason recorded for audit purposes.' })
    @IsOptional()
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'reason' }) })
    reason?: string
}
