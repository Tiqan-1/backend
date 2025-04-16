import { ApiProperty } from '@nestjs/swagger'
import { IsNumberString, IsOptional } from 'class-validator'

export class SearchQueryDto {
    @ApiProperty({
        type: Number,
        required: false,
        description: 'Controls the number of returned elements',
        default: 20,
    })
    @IsNumberString()
    @IsOptional()
    limit?: number

    @ApiProperty({
        type: Number,
        required: false,
        description: 'Controls the number of elements to be skipped (for paging)',
        default: 0,
    })
    @IsNumberString()
    @IsOptional()
    skip?: number
}
