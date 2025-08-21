import { ApiProperty } from '@nestjs/swagger'

export class ErrorDto {
    @ApiProperty({ type: Number, description: 'HTTP status code' })
    statusCode: number

    @ApiProperty({ type: String, description: 'error message', example: 'رسالة توضح الخطأ الحاصل' })
    message: string

    @ApiProperty({ type: String, description: 'HTTP error message' })
    error: string
}
