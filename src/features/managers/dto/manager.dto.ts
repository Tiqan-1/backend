import { ApiProperty, PickType } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword, MinLength } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { ManagerDocument } from '../schemas/manager.schema'

export class ManagerDto {
    constructor(document: ManagerDocument) {
        this.name = document.name
        this.email = document.email
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of manager' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'name' }) })
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of manager' })
    @IsEmail({}, { message: i18nValidationMessage('validation.email', { property: 'email' }) })
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
    @IsStrongPassword(
        { minLength: 6, minNumbers: 1 },
        { message: i18nValidationMessage('validation.strongPassword', { property: 'password' }) }
    )
    @MinLength(6, { message: i18nValidationMessage('validation.minLength', { min: 6, property: 'password' }) })
    password: string
}
