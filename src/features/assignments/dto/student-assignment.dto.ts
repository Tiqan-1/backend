import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { PaginatedDto } from 'src/shared/dto/paginated.dto';


// // DTO for a single question element, WITHOUT the 'answer' field.
// export class StudentFormElementDto {
//     @ApiProperty()
//     id: string;

//     @ApiProperty()
//     type: string;

//     @ApiProperty({ required: false })
//     question?: string;

//     @ApiProperty({ required: false })
//     choices?: string[];

//     @ApiProperty({ required: false })
//     options?: string[];

//     @ApiProperty({ required: false })
//     multiple?: boolean;
    
//     @ApiProperty({ required: false })
//     text?: string;
// }

// class StudentSlideDto {
//     @ApiProperty({ type: [StudentFormElementDto] })
//     elements: StudentFormElementDto[];
// }

// class StudentAssignmentFormDto {
//     @ApiProperty({ type: [StudentSlideDto] })
//     slides: StudentSlideDto[];
// }

// The main DTO for a single assignment in a student's list.
export class StudentAssignmentDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    durationInMinutes: number;

    @ApiProperty()
    availableFrom: Date;

    @ApiProperty()
    availableUntil: Date;
    
    @ApiProperty({ required: false })
    subjectName?: string;

    @ApiProperty({ required: false })
    levelName?: string;
    
    // // A stripped-down, answer-free version of the form if the student
    // // needs to see the questions before starting. If not, this can be removed.
    // @ApiProperty({ required: false })
    // form?: StudentAssignmentFormDto;
}

export class PaginatedAssignmentStudentDto extends PaginatedDto<StudentAssignmentDto> {
    @ApiProperty({ type: [StudentAssignmentDto] })
    @ValidateNested({ each: true })
    @Type(() => StudentAssignmentDto)
    declare items: StudentAssignmentDto[]
}