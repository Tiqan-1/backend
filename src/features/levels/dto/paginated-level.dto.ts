import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { LevelDto } from './level.dto'

export class PaginatedLevelDto extends PaginatedDto<LevelDto> {
    @ApiProperty({ type: [LevelDto] })
    @ValidateNested({ each: true })
    @Type(() => LevelDto)
    declare items: LevelDto[]
}
