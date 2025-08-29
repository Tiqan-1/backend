import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'

export class MessageDto {
    @ApiProperty({ required: true, type: String, description: 'message id' })
    @IsString()
    id: string
    @ApiProperty({ required: true, type: Date, description: 'message creation date', example: Date.now() })
    @IsDate()
    @Type(() => Date)
    createdAt: Date
    @ApiProperty({ required: false, type: Date, description: 'message last update date', example: Date.now() })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    updatedAt?: Date
    @ApiProperty({ required: true, type: String, description: 'message text' })
    @IsString()
    text: string
    @ApiProperty({ required: true, type: () => SimpleManagerDto, description: 'message sender' })
    @ValidateNested()
    @Type(() => SimpleManagerDto)
    sender: SimpleManagerDto
}
