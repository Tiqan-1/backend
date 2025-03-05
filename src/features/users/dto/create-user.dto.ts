import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword } from 'class-validator'

export class CreateUserDto {
    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of user' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of user' })
    @IsEmail()
    email: string

    @ApiProperty({ type: String, example: 'p@ssw0rd', description: 'password of user' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}
