import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class ChangePasswordRequestDto {
    @ApiProperty({ type: String, description: 'email address' })
    @IsEmail({}, { message: i18nValidationMessage('validation.email', { property: 'email' }) })
    email: string

    @ApiProperty({ type: String, description: 'password' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'password' }) })
    password: string

    @ApiProperty({ type: Number, description: 'password reset code' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'code' }) })
    code: string
}
