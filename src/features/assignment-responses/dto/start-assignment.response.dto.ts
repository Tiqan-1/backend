import { ApiProperty } from '@nestjs/swagger'
import { IsDate } from 'class-validator'
import { AssignmentFormDto } from '../../assignments/dto/assignment-form.dto'

export class StartAssignmentResponseDto extends AssignmentFormDto {
    @ApiProperty({ type: Date })
    @IsDate()
    startedAt: Date
}
