import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { UsersService } from './users.service'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    findAll() {
        return this.usersService.findAll()
    }

    @Delete(':email')
    remove(@Param('email') email: string) {
        return this.usersService.remove(email)
    }
}
