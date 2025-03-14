import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsEmail, IsString, IsStrongPassword } from 'class-validator'
import { SubscriptionDto } from '../../subscriptions/dto/subscription.dto'
import { Gender } from '../enums/gender'
import { StudentDocument } from '../schemas/student.schema'

export class SignUpStudentDto {
    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of student' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of student' })
    @IsEmail()
    email: string

    @ApiProperty({ enum: Gender, example: Gender.male, description: 'gender of student' })
    @IsEmail()
    gender: Gender

    @ApiProperty({ type: String, example: 'p@ssw0rd', description: 'password of student' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}

export class StudentDto extends OmitType(SignUpStudentDto, ['password']) {
    constructor(student: StudentDocument) {
        super()
        this.name = student.name
        this.email = student.email
        this.subscriptions = student.subscriptions
        this.gender = student.gender
    }

    @ApiProperty({ type: SubscriptionDto, isArray: true, description: 'subscriptions for student' })
    @IsEmail()
    subscriptions: SubscriptionDto[]
}
