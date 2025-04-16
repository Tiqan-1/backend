import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { isPopulated } from '../../../shared/helper/populated-type.helper'
import { LevelDto } from '../../levels/dto/level.dto'
import { ProgramDto, StudentProgramUnpopulatedDto } from '../../programs/dto/program.dto'
import { SimpleStudentDto } from '../../students/dto/student.dto'
import { SubscriptionState } from '../enums/subscription-state.enum'
import { SubscriptionDocument } from '../schemas/subscription.schema'

export class SubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'subscription' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: ProgramDto, required: false })
    @IsOptional()
    @ValidateNested()
    program?: ProgramDto

    @ApiProperty({ type: LevelDto, required: false })
    @IsOptional()
    @ValidateNested()
    level?: LevelDto

    @ApiProperty({ type: SimpleStudentDto, required: false })
    @IsOptional()
    @ValidateNested()
    subscriber?: SimpleStudentDto

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
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
        return {
            id: subscription._id.toString(),
            program: isPopulated(subscription.program) ? ProgramDto.fromDocument(subscription.program) : undefined,
            level: isPopulated(subscription.level) ? LevelDto.fromDocument(subscription.level) : undefined,
            subscriptionDate: subscription.subscriptionDate,
            subscriber: isPopulated(subscription.subscriber) ? SimpleStudentDto.fromDocument(subscription.subscriber) : undefined,
            state: subscription.state,
            notes: subscription.notes,
        }
    }
}

export class StudentSubscriptionDto extends OmitType(SubscriptionDto, ['program', 'subscriber']) {
    @ApiProperty({ type: StudentProgramUnpopulatedDto, required: false })
    @IsOptional()
    @ValidateNested()
    program?: StudentProgramUnpopulatedDto

    static fromDocuments(subscriptions: SubscriptionDocument[] = []): StudentSubscriptionDto[] {
        return subscriptions.map(subscription => this.fromDocument(subscription))
    }

    static fromDocument(subscription: SubscriptionDocument): StudentSubscriptionDto {
        return {
            id: subscription._id.toString(),
            program: isPopulated(subscription.program)
                ? StudentProgramUnpopulatedDto.fromDocument(subscription.program)
                : undefined,
            level: isPopulated(subscription.level) ? LevelDto.fromDocument(subscription.level) : undefined,
            subscriptionDate: subscription.subscriptionDate,
            state: subscription.state,
            notes: subscription.notes,
        }
    }
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
