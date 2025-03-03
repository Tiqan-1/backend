import { IsEmail, IsString } from 'class-validator'

export class FindUserDto {
    @IsString()
    name: string

    @IsEmail()
    email: string
}
