import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { AssignmentResponseDto } from './assignment-response.dto'

export class PaginatedAssignmentResponseDto extends PaginatedDto<AssignmentResponseDto> {
    @ApiProperty({ type: [AssignmentResponseDto] })
    @ValidateNested({ each: true })
    @Type(() => AssignmentResponseDto)
    declare items: AssignmentResponseDto[]
}
