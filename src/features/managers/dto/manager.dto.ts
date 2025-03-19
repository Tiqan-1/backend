import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword, ValidateNested } from 'class-validator'
import { ProgramDto } from '../../programs/dto/program.dto'
import { SubjectDto } from '../../subjects/dto/subject.dto'
import { ManagerDocument } from '../schemas/manager.schema'

export class ManagerDto {
    constructor(manager: ManagerDocument) {
        this.name = manager.name
        this.email = manager.email
        this.programs = manager.programs
        this.subjects = SubjectDto.fromDocuments(manager.subjects)
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail()
    email: string

    @ApiProperty({ type: ProgramDto, isArray: true, description: 'active programs created by manager' })
    @ValidateNested({ each: true })
    programs: ProgramDto[]

    @ApiProperty({ type: SubjectDto, isArray: true, description: 'subjects created by manager' })
    @ValidateNested({ each: true })
    subjects: SubjectDto[]
}

export class simpleManagerDto extends PickType(ManagerDto, ['name', 'email']) {
    constructor(manager: ManagerDocument) {
        super()
        this.name = manager.name
        this.email = manager.email
    }
}

export class SignUpManagerDto extends PickType(ManagerDto, ['name', 'email']) {
    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password of manager' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}
