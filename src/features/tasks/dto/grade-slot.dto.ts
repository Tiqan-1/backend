import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class GradeSlotDto {
    @ApiProperty({ type: Number, required: true, minimum: 0, maximum: 100 })
    @Type(() => Number)
    @IsNumber({}, { message: i18nValidationMessage('validation.number', { property: 'grade' }) })
    @Min(0, { message: i18nValidationMessage('validation.min', { property: 'grade', min: 0 }) })
    @Max(100, { message: i18nValidationMessage('validation.max', { property: 'grade', max: 100 }) })
    grade: number

    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'feedback' }) })
    feedback?: string
}
