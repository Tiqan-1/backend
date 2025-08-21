import { ApiProperty } from '@nestjs/swagger'

export class BadRequestErrorDto {
    @ApiProperty({ type: Number, example: 400, description: 'HTTP status code' })
    statusCode: number

    @ApiProperty({
        type: String,
        isArray: true,
        description: 'error messages',
        example: ['البريد الإلكتروني المُدخل غير صالح', 'كلمة المرور غير آمنة، الرجاء اختيار كلمة مرور تراعي شروط الأمان'],
    })
    message: string[]

    @ApiProperty({ type: String, description: 'HTTP error message', example: 'Bad Request' })
    error: string
}
