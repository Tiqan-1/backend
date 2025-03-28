import { InternalServerErrorException } from '@nestjs/common'
import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword, ValidateNested } from 'class-validator'
import { areNotPopulated } from '../../../shared/helper/populated-type.helper'
import { ProgramDto } from '../../programs/dto/program.dto'
import { SubjectDto } from '../../subjects/dto/subject.dto'
import { ManagerDocument } from '../schemas/manager.schema'

export class ManagerDto {
    constructor(document: ManagerDocument) {
        this.name = document.name
        this.email = document.email
        if (areNotPopulated(document.programs) || areNotPopulated(document.subjects)) {
            throw new InternalServerErrorException(`Manager's programs or subjects are unexpectedly unpopulated`)
        }
        this.programs = ProgramDto.fromDocuments(document.programs)
        this.subjects = SubjectDto.fromDocuments(document.subjects)
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail()
    email: string

    @ApiProperty({ type: () => ProgramDto, isArray: true, description: 'active programs created by manager' })
    @ValidateNested({ each: true })
    programs: ProgramDto[]

    @ApiProperty({ type: SubjectDto, isArray: true, description: 'subjects created by manager' })
    @ValidateNested({ each: true })
    subjects: SubjectDto[]
}

export class SimpleManagerDto extends PickType(ManagerDto, ['name', 'email']) {
    constructor(manager: ManagerDocument) {
        super()
        this.name = manager.name
        this.email = manager.email
    }

    static fromDocument(createdBy: ManagerDocument): SimpleManagerDto {
        return {
            name: createdBy.name,
            email: createdBy.email,
        }
    }
}

export class SignUpManagerDto extends PickType(ManagerDto, ['name', 'email']) {
    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password of manager' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}
