import { ApiProperty } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'
import { isPopulated } from '../../../shared/helper/populated-type.helper'
import { AssignmentDto } from '../../assignments/dto/assignment.dto'
import { AssignmentTaskDocument } from '../schemas/assignment-task.schema'
import { TaskDto } from './task.dto'

export class AssignmentTaskDto extends TaskDto {
    @ApiProperty({
        type: AssignmentDto,
        required: false,
        description: 'The assignment for the task (required for Assignment Tasks)',
    })
    @IsOptional()
    assignment?: AssignmentDto

    constructor(document: AssignmentTaskDocument) {
        super(document)
        this.assignment =
            document.assignment && isPopulated(document.assignment) ? AssignmentDto.fromDocument(document.assignment) : undefined
    }

    fromDocument(document: AssignmentTaskDocument): AssignmentTaskDto {
        return new AssignmentTaskDto(document)
    }

    fromDocuments(docs: AssignmentTaskDocument[]): AssignmentTaskDto[] {
        return docs.map(doc => this.fromDocument(doc))
    }
}
