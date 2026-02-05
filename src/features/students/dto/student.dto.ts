import { ApiProperty, OmitType, PickType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEmail, IsEnum, IsString, IsStrongPassword, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
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
        this.profilePicture = student.profilePicture
    }

    @ApiProperty({ type: String, example: 'John Doe', description: 'full name of student' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'name' }) })
    name: string

    @ApiProperty({ type: String, example: 'user@email.com', description: 'email of student' })
    @IsEmail({}, { message: i18nValidationMessage('validation.email', { property: 'email' }) })
    email: string

    @ApiProperty({ enum: Gender, example: Gender.male, description: 'gender of student' })
    @IsEnum(Gender, { message: i18nValidationMessage('validation.enum', { property: 'gender', values: Object.values(Gender) }) })
    gender: Gender

    @ApiProperty({ type: String, required: false, description: 'profile picture of student' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'profilePicture' }) })
    profilePicture?: string

    @ApiProperty({ type: String, required: false, description: 'academic number of student' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'academicNumber' }) })
    academicNumber: string

    @ApiProperty({ type: String, required: false, description: 'phone number of student' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'phone' }) })
    phoneNumber: string

    @ApiProperty({ type: Date, required: false, description: 'date of birth of student' })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'dateOfBirth' }) })
    dateOfBirth: Date

    @ApiProperty({ type: String, required: false, description: 'country of student' })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'country' }) })
    country: string

    @ApiProperty({ type: () => SubscriptionDto, isArray: true, description: 'subscriptions for student' })
    @ValidateNested({ each: true })
    subscriptions: SubscriptionDto[]
}

export class SimpleStudentDto extends PickType(StudentDto, ['name', 'email']) {
    static fromDocument(subscriber: StudentDocument): SimpleStudentDto {
        return {
            name: subscriber.name,
            email: subscriber.email,
        }
    }
}

export class SignUpStudentDto extends OmitType(StudentDto, ['subscriptions', 'profilePicture', 'academicNumber']) {
    @ApiProperty({ type: String, example: 'P@ssw0rd', description: 'password of student' })
    @IsStrongPassword(
        { minLength: 6, minNumbers: 0, minSymbols: 0, minLowercase: 0, minUppercase: 0 },
        { message: i18nValidationMessage('validation.strongPassword', { property: 'password' }) }
    )
    password: string
}
