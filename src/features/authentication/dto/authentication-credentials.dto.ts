import { IsEmail, IsString } from 'class-validator'

export class AuthenticationCredentialsDto {
    @IsEmail()
    email: string
    @IsString()
    password: string
}
