import { IsEmail, IsString } from 'class-validator'
import { UserDocument } from '../schemas/user.schema'

export class FindUserDto {
    constructor(userDocument: UserDocument) {
        this.email = userDocument.email
        this.name = userDocument.name
    }

    @IsString()
    name: string

    @IsEmail()
    email: string
}
