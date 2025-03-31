import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsString, IsStrongPassword, ValidateNested } from 'class-validator'
import { arePopulated } from '../../../shared/helper/populated-type.helper'
import { SubscriptionDto } from '../../subscriptions/dto/subscription.dto'
import { Gender } from '../enums/gender'
import { Student, StudentDocument } from '../schemas/student.schema'

export class StudentDto {
    constructor(student: Student) {
        this.name = student.name
        this.email = student.email
        this.subscriptions = arePopulated(student.subscriptions) ? SubscriptionDto.fromDocuments(student.subscriptions) : []
        this.gender = student.gender
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of student' })
    @IsString()
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of student' })
    @IsEmail()
    email: string

    @ApiProperty({ enum: Gender, example: Gender.male, description: 'gender of student' })
    @IsEnum(Gender)
    gender: Gender

    @ApiProperty({ type: () => SubscriptionDto, isArray: true, description: 'subscriptions for student' })
    @ValidateNested({ each: true })
    subscriptions: SubscriptionDto[]
}

export class SimpleStudentDto extends OmitType(StudentDto, ['subscriptions', 'gender']) {
    static fromDocument(subscriber: StudentDocument): SimpleStudentDto {
        return {
            name: subscriber.name,
            email: subscriber.email,
        }
    }
}

export class SignUpStudentDto extends OmitType(StudentDto, ['subscriptions']) {
    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password of student' })
    @IsStrongPassword({ minLength: 6, minNumbers: 1, minSymbols: 1 })
    password: string
}
