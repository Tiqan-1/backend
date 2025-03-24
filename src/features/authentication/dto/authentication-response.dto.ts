import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class AuthenticationResponseDto {
    @ApiProperty({ type: String, example: 'ex2303912...', description: 'access token.' })
    @IsString()
    accessToken: string

    @ApiProperty({ type: String, example: '1023-1023...', description: 'refresh token.' })
    @IsString()
    refreshToken: string

    @ApiProperty({ type: String, example: 'John Doe', description: 'Full name of the user.' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'Email of the user.' })
    @IsEmail()
    email: string
}
