import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto): Promise<void> {
        return this.usersService.create(createUserDto)
    }

    @Get()
    findAll() {
        console.log('test')
        return this.usersService.findAll()
    }

    @Get(':email')
    findOne(@Param('email') email: string) {
        return this.usersService.findOne(email)
    }

    @Delete(':email')
    remove(@Param('email') email: string) {
        return this.usersService.remove(email)
    }
}
