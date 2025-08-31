// import { ApiProperty } from '@nestjs/swagger';
// import { IsNumber, IsOptional, IsString } from 'class-validator';

// // A specific DTO for when a manager grades a response.
// // They can ONLY provide a score and notes.
// export class GradeResponseDto {
//     @ApiProperty()
//     @IsNumber()
//     score: number;

//     @ApiProperty({ required: false })
//     @IsOptional()
//     @IsString()
//     notes?: string;
// }