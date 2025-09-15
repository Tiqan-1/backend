import { ApiProperty } from '@nestjs/swagger'
import { ElementType } from '../../assignments/types/form.type'

export class SlideDto {
    @ApiProperty({ type: Object, isArray: true })
    elements: ElementType[]
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
