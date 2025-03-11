import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RefreshTokenRequestDto {
    @ApiProperty({ type: String, example: '1023-1023...', description: 'refresh token' })
    @IsString()
    refreshToken: string
}
