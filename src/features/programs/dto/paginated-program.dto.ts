import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { ProgramDto } from './program.dto'

export class PaginatedProgramDto extends PaginatedDto<ProgramDto> {
    @ApiProperty({ type: [ProgramDto] })
    @ValidateNested({ each: true })
    @Type(() => ProgramDto)
    declare items: ProgramDto[]
}
