import { ApiProperty } from '@nestjs/swagger'
import { IsObject, IsOptional, IsString } from 'class-validator'

export class GradeManualDto {
    @ApiProperty({
        description: 'Object of question IDs and the scores awarded by the manager.',
        example: { 'essay-question-id': 8 },
    })
    @IsObject()
    scores: Record<string, number>

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string
}
