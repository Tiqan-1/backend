import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional } from 'class-validator'

export class SearchQueryDto {
    @ApiProperty({
        type: Number,
        required: false,
        description: 'Controls the number of returned elements',
        default: 20,
    })
    @IsNumber()
    @IsOptional()
    limit?: number

    @ApiProperty({
        type: Number,
        required: false,
        description: 'Controls the number of elements to be skipped (for paging)',
        default: 0,
    })
    @IsNumber()
    @IsOptional()
    skip?: number
}
