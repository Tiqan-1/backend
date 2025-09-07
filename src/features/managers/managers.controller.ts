import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersService } from './managers.service'

@Controller('api/managers')
export class ManagersController {
    constructor(private readonly managersService: ManagersService) {}

    @ApiOperation({ summary: 'Signs a manager-user up', description: 'Signs a manager-user up and returns the created user.' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'A user with the same email address already exists.',
        type: ErrorDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpManagerDto: SignUpManagerDto): Promise<AuthenticationResponseDto> {
        return this.managersService.create(signUpManagerDto)
    }
}
