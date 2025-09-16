import { ApiProperty } from '@nestjs/swagger'
import { IsDate } from 'class-validator'
import { Question } from '../../assignments/types/form.type'

export class SlideDto {
    @ApiProperty({ type: Object, isArray: true })
    elements: Question[]
}

export class StartAssignmentResponseDto {
    @ApiProperty({ type: Date })
    @IsDate()
    startedAt: Date

    @ApiProperty({ type: Object })
    settings: Record<string, unknown>

    @ApiProperty({ type: [SlideDto] })
    slides: SlideDto[]
}
