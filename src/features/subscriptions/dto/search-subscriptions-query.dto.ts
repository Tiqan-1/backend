import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsMongoId, IsOptional } from 'class-validator'
import { ObjectId } from 'src/shared/repository/types'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { SubscriptionDto } from './subscription.dto'

export class SearchSubscriptionsQueryDto extends IntersectionType(
    PartialType(OmitType(SubscriptionDto, ['program', 'level', 'subscriber', 'currentLevel'] as const)),
    SearchQueryDto
) {
    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    programId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    levelId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    subscriberId?: ObjectId
}

export class SearchStudentSubscriptionsQueryDto extends OmitType(SearchSubscriptionsQueryDto, ['subscriberId'] as const) {
    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    programId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    levelId?: ObjectId

    @ApiProperty({ type: String, required: false })
    @IsMongoId()
    @IsOptional()
    @Type(() => ObjectId)
    subscriberId?: ObjectId
}
