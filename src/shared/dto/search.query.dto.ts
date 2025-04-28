import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'

export class SearchQueryDto {
    @ApiProperty({
        type: Number,
        required: false,
        description: 'Selects the page to be returned. Default is 1.',
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    page: number = 1

    @ApiProperty({
        type: Number,
        required: false,
        description: 'Sets the page size. Default is 20.',
        default: 20,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    pageSize: number = 20
}
