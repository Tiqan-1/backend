import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, ValidateNested } from 'class-validator'

export class PaginatedDto<T> {
    @ApiProperty({ isArray: true, description: 'The paginated items.' })
    @ValidateNested({ each: true })
    items: T[]

    @ApiProperty({ description: 'Total number of items found.', example: 100 })
    @IsNumber()
    total: number

    @ApiProperty({ description: 'Current page number.', example: 1 })
    @IsNumber()
    page: number

    @ApiProperty({ description: 'Number of items per page.', example: 10 })
    @IsNumber()
    pageSize: number
}
