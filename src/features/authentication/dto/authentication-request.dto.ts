import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class AuthenticationRequestDto {
    @ApiProperty({ type: String, example: 'user@email.com', description: 'email address' })
    @IsEmail()
    email: string

    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password' })
    @IsString()
    password: string
}
