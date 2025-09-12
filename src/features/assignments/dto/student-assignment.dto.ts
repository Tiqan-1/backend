import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { PaginatedDto } from 'src/shared/dto/paginated.dto'

export class StudentAssignmentDto {
    @ApiProperty()
    id: string

    @ApiProperty()
    title: string

    @ApiProperty()
    type: string

    @ApiProperty()
    durationInMinutes: number

    @ApiProperty()
    availableFrom: Date

    @ApiProperty()
    availableUntil: Date

    @ApiProperty({ required: false })
    taskId?: string
}

export class PaginatedAssignmentStudentDto extends PaginatedDto<StudentAssignmentDto> {
    @ApiProperty({ type: [StudentAssignmentDto] })
    @ValidateNested({ each: true })
    @Type(() => StudentAssignmentDto)
    declare items: StudentAssignmentDto[]
}
