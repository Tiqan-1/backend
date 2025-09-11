import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class RefreshTokenRequestDto {
    @ApiProperty({ type: String, example: '1023-1023...', description: 'refresh token' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'refreshToken' }) })
    refreshToken: string
}
