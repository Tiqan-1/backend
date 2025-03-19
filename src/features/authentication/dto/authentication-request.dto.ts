import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AuthenticationRequestDto {
    @ApiProperty({ type: String, example: 'user@email.com', description: 'email address' })
    @IsString()
    email: string

    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password' })
    @IsString()
    password: string
}
