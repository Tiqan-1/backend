import { ApiProperty } from '@nestjs/swagger'

export class AuthenticationRequestDto {
    @ApiProperty({ type: String, example: 'user@email.com', description: 'email address' })
    email: string

    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password' })
    password: string
}
