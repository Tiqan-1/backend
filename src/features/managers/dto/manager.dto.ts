import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword } from 'class-validator'
import { ProgramDto } from '../../programs/dto/program.dto'
import { ManagerDocument } from '../schemas/manager.schema'

export class ManagerDto {
    constructor(manager: ManagerDocument) {
        this.name = manager.name
        this.email = manager.email
        this.programs = manager.programs
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail()
    email: string

    @ApiProperty({ type: ProgramDto, isArray: true, description: 'active programs created by manager' })
    @IsEmail()
    programs: ProgramDto[]
}

export class SignUpManagerDto {
    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail()
    email: string

    @ApiProperty({ type: String, example: 'p@ssw0rd', description: 'password of manager' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}
