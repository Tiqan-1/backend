import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class SearchQueryDto {
    @ApiProperty({
        type: Number,
        required: false,
        description: 'Selects the page to be returned. Default is 1.',
    })
    @Type(() => Number)
    @IsNumber({}, { message: i18nValidationMessage('validation.number', { property: 'page' }) })
    @IsOptional()
    page?: number = 1

    @ApiProperty({
        type: Number,
        required: false,
        description: 'Sets the page size. Default is 20.',
        default: 20,
    })
    @Type(() => Number)
    @IsNumber({}, { message: i18nValidationMessage('validation.number', { property: 'pageSize' }) })
    @IsOptional()
    pageSize?: number = 20
}
