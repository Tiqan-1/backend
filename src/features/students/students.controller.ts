import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentsService } from './students.service'

@Controller('api/students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) {}

    @ApiOperation({ summary: 'Signs a student-user up', description: 'Signs a student-user up and returns the created user.' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'The user got created successfully.',
        type: AuthenticationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A user with the same email address already exists.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpStudentDto: SignUpStudentDto): Promise<AuthenticationResponseDto> {
        return this.studentsService.create(signUpStudentDto)
    }
}
