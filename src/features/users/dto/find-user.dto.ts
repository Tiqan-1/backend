import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { UserDocument } from '../schemas/user.schema'

export class FindUserDto {
    constructor(userDocument: UserDocument) {
        this.email = userDocument.email
        this.name = userDocument.name
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of user' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'name' }) })
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of user' })
    @IsEmail({}, { message: i18nValidationMessage('validation.email', { property: 'email' }) })
    email: string
}
