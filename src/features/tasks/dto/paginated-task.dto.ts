import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from '../../../shared/dto/paginated.dto'
import { TaskDto } from './task.dto'

export class PaginatedTaskDto extends PaginatedDto<TaskDto> {
    @ApiProperty({ type: [TaskDto] })
    @ValidateNested({ each: true })
    @Type(() => TaskDto)
    declare items: TaskDto[]
}
