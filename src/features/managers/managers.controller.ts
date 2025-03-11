import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ManagerDto, SignUpManagerDto } from './dto/manager.dto'
import { ManagersService } from './managers.service'

@Controller('api/managers')
export class ManagersController {
    constructor(private readonly managersService: ManagersService) {}

    @ApiOperation({ summary: 'Signs a manager-user up', description: 'Signs a manager-user up and returns the created user.' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'The user got created successfully.', type: ManagerDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal error occurred while creating the user.' })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpManagerDto: SignUpManagerDto): Promise<ManagerDto> {
        return this.managersService.create(signUpManagerDto)
    }
}
