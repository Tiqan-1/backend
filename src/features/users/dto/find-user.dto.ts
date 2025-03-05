import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'
import { UserDocument } from '../schemas/user.schema'

export class FindUserDto {
    constructor(userDocument: UserDocument) {
        this.email = userDocument.email
        this.name = userDocument.name
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of user' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of user' })
    @IsEmail()
    email: string
}
