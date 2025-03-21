import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreatedDto {
    @ApiProperty({ type: String, required: true, example: 'objectId' })
    @IsString()
    id: string
}
