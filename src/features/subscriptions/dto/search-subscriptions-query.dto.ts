import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsMongoId, IsOptional } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { ObjectId } from 'src/shared/repository/types'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { SubscriptionDto } from './subscription.dto'

export class SearchSubscriptionsQueryDto extends IntersectionType(
    PartialType(OmitType(SubscriptionDto, ['program', 'level', 'subscriber', 'currentLevel'] as const)),
    SearchQueryDto
) {
    @ApiProperty({ type: String, required: false })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'programId' }) })
    @IsOptional()
    @Type(() => ObjectId)
    programId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'levelId' }) })
    @IsOptional()
    @Type(() => ObjectId)
    levelId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'subscriberId' }) })
    @IsOptional()
    @Type(() => ObjectId)
    subscriberId?: ObjectId
}
