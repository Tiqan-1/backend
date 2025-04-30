import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { StudentSubscriptionDto, SubscriptionDto } from './subscription.dto'

export class PaginatedSubscriptionDto extends PaginatedDto<SubscriptionDto> {
    @ApiProperty({ type: [SubscriptionDto] })
    @ValidateNested({ each: true })
    @Type(() => SubscriptionDto)
    declare items: SubscriptionDto[]
}

export class PaginatedStudentSubscriptionDto extends PaginatedDto<StudentSubscriptionDto> {
    @ApiProperty({ type: [StudentSubscriptionDto] })
    @ValidateNested({ each: true })
    @Type(() => StudentSubscriptionDto)
    declare items: StudentSubscriptionDto[]
}
