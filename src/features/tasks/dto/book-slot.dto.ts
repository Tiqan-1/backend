import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsMongoId } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { ObjectId } from '../../../shared/repository/types'

export class BookSlotDto {
    @ApiProperty({ type: String, required: true, description: 'The subscription that grants the student access to the task.' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId', { property: 'subscriptionId' }) })
    @Type(() => ObjectId)
    subscriptionId: ObjectId
}
