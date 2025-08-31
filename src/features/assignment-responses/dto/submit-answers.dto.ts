import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export type RepliesPlainDto = Record<string, any>;

// export class RepliesDtoWrapper {
//     @ApiProperty({
//         description: 'Object containing question IDs as keys and student answers as values.',
//         example: { 'q1': 'A', 'q2': 'The answer is...' },
//     })
//     @IsObject()
//     replies: Record<string, any>;
// }