import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { isPopulated } from '../../../shared/helper/populated-type.helper'
import { LevelDto } from '../../levels/dto/level.dto'
import { ProgramDto } from '../../programs/dto/program.dto'
import { State } from '../enums/state.enum'
import { SubscriptionDocument } from '../schemas/subscription.schema'

export class SubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
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

    @ApiProperty({ type: String, required: true, enum: State, example: 'subjectId' })
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

export class CreateSubscriptionDto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsString()
    programId: string

    @ApiProperty({ type: String, required: true, example: 'levelId' })
    @IsString()
    levelId: string
}

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
    @ApiProperty({ type: String, required: false, enum: State, example: 'subjectId' })
    @IsOptional()
    @IsEnum(State)
    state?: State
}
