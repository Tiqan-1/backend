import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class I18nDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    ar: string

    @ApiProperty({ type: String, required: false })
    @IsString()
    @IsOptional()
    en?: string
}
