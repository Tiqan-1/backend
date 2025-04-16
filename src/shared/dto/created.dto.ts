import { ApiProperty } from '@nestjs/swagger'
import { IsMongoId } from 'class-validator'

export class CreatedDto {
    @ApiProperty({ type: String, required: true, example: 'objectId' })
    @IsMongoId()
    id: string
}
