import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { isPopulated } from '../../../shared/helper/populated-type.helper'
import { LevelDto } from '../../levels/dto/level.dto'
import { ProgramDto, StudentProgramUnpopulatedDto } from '../../programs/dto/program.dto'
import { State } from '../enums/state.enum'
import { SubscriptionDocument } from '../schemas/subscription.schema'

export class SubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'subscription' })
    @IsString()
    id: string

    @ApiProperty({ type: ProgramDto, required: false })
    @IsOptional()
    @ValidateNested()
    program?: ProgramDto

    @ApiProperty({ type: LevelDto, required: false })
    @IsOptional()
    @ValidateNested()
    level?: LevelDto

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
    subscriptionDate: Date

    @ApiProperty({ type: String, required: true, enum: State })
    @IsEnum(State)
    state: State

    static fromDocuments(subscriptions: SubscriptionDocument[] = []): SubscriptionDto[] {
        return subscriptions.map(subscription => this.fromDocument(subscription))
    }

    static fromDocument(subscription: SubscriptionDocument): SubscriptionDto {
        return {
            id: subscription._id.toString(),
            program: isPopulated(subscription.program) ? ProgramDto.fromDocument(subscription.program) : undefined,
            level: isPopulated(subscription.level) ? LevelDto.fromDocument(subscription.level) : undefined,
            subscriptionDate: subscription.subscriptionDate,
            state: subscription.state,
        }
    }
}

export class StudentSubscriptionDto extends OmitType(SubscriptionDto, ['program']) {
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
        }
    }
}

export class CreateSubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsString()
    programId: string

    @ApiProperty({ type: String, required: true, example: 'levelId' })
    @IsString()
    levelId: string
}

export class UpdateSubscriptionDto {
    @ApiProperty({ type: String, required: true, enum: State, example: 'subjectId' })
    @IsEnum(State)
    state: State
}
