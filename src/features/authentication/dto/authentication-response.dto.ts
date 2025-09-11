import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class AuthenticationResponseDto {
    @ApiProperty({ type: String, example: 'ex2303912...', description: 'access token.' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'accessToken' }) })
    accessToken: string

    @ApiProperty({ type: String, example: '1023-1023...', description: 'refresh token.' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'refreshToken' }) })
    refreshToken: string

    @ApiProperty({ type: String, example: 'John Doe', description: 'Full name of the user.' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'name' }) })
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'Email of the user.' })
    @IsEmail({}, { message: i18nValidationMessage('validation.email', { property: 'email' }) })
    email: string
}
