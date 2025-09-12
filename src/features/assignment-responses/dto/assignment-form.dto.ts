import { ApiProperty } from '@nestjs/swagger'

export class SlideDto {
    @ApiProperty({ type: Object })
    elements: Map<string, unknown>
}

export class AssignmentFormDto {
    @ApiProperty({ type: Object })
    settings: Record<string, unknown>

    @ApiProperty({ type: SlideDto })
    startSlide?: SlideDto

    @ApiProperty({ type: [SlideDto] })
    slides: SlideDto[]

    @ApiProperty({ type: SlideDto })
    endSlide?: SlideDto
}
