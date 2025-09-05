import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { ProgramDto, ProgramWithSubscriptionDto } from './program.dto'

export class PaginatedProgramDto extends PaginatedDto<ProgramDto> {
    @ApiProperty({ type: [ProgramDto] })
    @ValidateNested({ each: true })
    @Type(() => ProgramDto)
    declare items: ProgramDto[]
}

export class PaginatedProgramWithSubscriptionDto extends PaginatedDto<ProgramDto> {
    @ApiProperty({ type: [ProgramWithSubscriptionDto] })
    @ValidateNested({ each: true })
    @Type(() => ProgramWithSubscriptionDto)
    declare items: ProgramWithSubscriptionDto[]
}
