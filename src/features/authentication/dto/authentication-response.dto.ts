import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AuthenticationResponseDto {
    @ApiProperty({ type: String, example: 'ex2303912...', description: 'access token' })
    @IsString()
    accessToken: string

    @ApiProperty({ type: String, example: '1023-1023...', description: 'refresh token' })
    @IsString()
    refreshToken: string
}
