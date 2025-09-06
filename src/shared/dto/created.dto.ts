import { ApiProperty } from '@nestjs/swagger'
import { IsMongoId } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreatedDto {
    @ApiProperty({ type: String, required: true, example: 'objectId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'id' }) })
    id: string
}
