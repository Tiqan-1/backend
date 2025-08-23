import { ApiProperty, OmitType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { isAfter, isBefore } from 'date-fns'
import { i18nValidationMessage } from 'nestjs-i18n'
import { LevelDto } from '../../levels/dto/level.dto'
import { LevelDocument } from '../../levels/schemas/level.schema'
import { ProgramDto } from '../../programs/dto/program.dto'
import { ProgramDocument } from '../../programs/schemas/program.schema'
import { SimpleStudentDto } from '../../students/dto/student.dto'
import { StudentDocument } from '../../students/schemas/student.schema'
import { SubscriptionState } from '../enums/subscription-state.enum'
import { SubscriptionDocument } from '../schemas/subscription.schema'

export class SubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'subscription' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: ProgramDto, required: false })
    @IsOptional()
    @ValidateNested()
    program: ProgramDto

    @ApiProperty({ type: LevelDto, required: false, deprecated: true })
    @IsOptional()
    @ValidateNested()
    /** @deprecated */
    level?: LevelDto

    @ApiProperty({ type: LevelDto, required: false })
    @IsOptional()
    @ValidateNested()
    currentLevel?: LevelDto

    @ApiProperty({ type: SimpleStudentDto, required: false })
    @IsOptional()
    @ValidateNested()
    subscriber: SimpleStudentDto

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @Type(() => Date)
    @IsDate()
    subscriptionDate: Date

    @ApiProperty({ type: String, required: true, enum: SubscriptionState })
    @IsEnum(SubscriptionState)
    state: SubscriptionState

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    notes?: string

    static fromDocuments(subscriptions: SubscriptionDocument[] = []): SubscriptionDto[] {
        return subscriptions.map(subscription => this.fromDocument(subscription))
    }

    static fromDocument(subscription: SubscriptionDocument): SubscriptionDto {
        const currentLevel = (subscription.program as ProgramDocument).levels.find(
            (level: LevelDocument) => isBefore(level.start, Date.now()) && isAfter(level.end, Date.now())
        )
        return {
            id: subscription._id.toString(),
            program: ProgramDto.fromDocument(subscription.program as ProgramDocument),
            level: subscription.level && LevelDto.fromDocument(subscription.level as LevelDocument),
            currentLevel: currentLevel && LevelDto.fromDocument(currentLevel as LevelDocument),
            subscriptionDate: subscription.subscriptionDate,
            subscriber: SimpleStudentDto.fromDocument(subscription.subscriber as StudentDocument),
            state: subscription.state,
            notes: subscription.notes,
        }
    }
}

export class StudentSubscriptionDto extends OmitType(SubscriptionDto, ['subscriber']) {
    @ApiProperty({ type: ProgramDto, required: false })
    @IsOptional()
    @ValidateNested()
    program: ProgramDto

    static fromDocuments(subscriptions: SubscriptionDocument[] = []): StudentSubscriptionDto[] {
        return subscriptions.map(subscription => this.fromDocument(subscription))
    }

    static fromDocument(subscription: SubscriptionDocument): StudentSubscriptionDto {
        const currentLevel = (subscription.program as ProgramDocument).levels.find(
            (level: LevelDocument) => isBefore(level.start, Date.now()) && isAfter(level.end, Date.now())
        )
        return {
            id: subscription._id.toString(),
            program: ProgramDto.fromDocument(subscription.program as ProgramDocument),
            level: subscription.level && LevelDto.fromDocument(subscription.level as LevelDocument),
            currentLevel: currentLevel && LevelDto.fromDocument(currentLevel as LevelDocument),
            subscriptionDate: subscription.subscriptionDate,
            state: subscription.state,
            notes: subscription.notes,
        }
    }
}

export class CreateSubscriptionV2Dto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId') })
    programId: string
}

export class CreateSubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsMongoId()
    programId: string

    @ApiProperty({ type: String, required: true, example: 'levelId' })
    @IsMongoId()
    levelId: string
}

export class UpdateSubscriptionDto {
    @ApiProperty({ type: String, required: false, enum: SubscriptionState, example: 'subjectId' })
    @IsOptional()
    @IsEnum(SubscriptionState)
    state?: SubscriptionState

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    notes?: string
}
