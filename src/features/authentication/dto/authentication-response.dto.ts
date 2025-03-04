import { IsString } from 'class-validator'

export class AuthenticationResponseDto {
    @IsString()
    accessToken: string

    @IsString()
    refreshToken: string
}
