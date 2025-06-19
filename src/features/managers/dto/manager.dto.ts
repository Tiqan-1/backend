import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { ManagerDocument } from '../schemas/manager.schema'

export class ManagerDto {
    constructor(document: ManagerDocument) {
        this.name = document.name
        this.email = document.email
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail()
    email: string
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
    @IsString()
    password: string
}
