import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { LessonDto } from './lesson.dto'

export class PaginatedLessonDto extends PaginatedDto<LessonDto> {
    @ApiProperty({ type: [LessonDto] })
    @ValidateNested({ each: true })
    @Type(() => LessonDto)
    declare items: LessonDto[]
}
