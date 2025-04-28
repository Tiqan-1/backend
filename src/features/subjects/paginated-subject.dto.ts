import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../shared/dto/paginated.dto'
import { SubjectDto } from './dto/subject.dto'

export class PaginatedSubjectDto extends PaginatedDto<SubjectDto> {
    @ApiProperty({ type: [SubjectDto] })
    @ValidateNested({ each: true })
    @Type(() => SubjectDto)
    declare items: SubjectDto[]
}
