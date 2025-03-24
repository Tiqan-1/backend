import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateProgramDto, ProgramDto, StudentProgramDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramsService } from './programs.service'

@ApiBearerAuth()
@Controller('api/programs')
export class ProgramsController {
    constructor(private readonly programsService: ProgramsService) {}

    @ApiOperation({ summary: 'Creates a program', description: 'Creates a program.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Program successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post('managers')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createProgramDto: CreateProgramDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.programsService.create(createProgramDto, request.user.id)
    }

    @ApiOperation({ summary: 'Finds all programs', description: 'Finds all programs.' })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Controls the number of returned elements',
        default: 20,
    })
    @ApiQuery({
        name: 'skip',
        type: Number,
        required: false,
        description: 'Controls the number of elements to be skipped (for paging)',
        default: 0,
    })
    @ApiResponse({ status: HttpStatus.OK, type: StudentProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @Get()
    @UseGuards(JwtAuthGuard)
    findAllForStudent(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<StudentProgramDto[]> {
        return this.programsService.findAllForStudents(limit, skip)
    }

    @ApiOperation({
        summary: 'Finds all programs (enriched for managers)',
        description: 'Finds all programs (enriched for managers).',
    })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Controls the number of returned elements',
        default: 20,
    })
    @ApiQuery({
        name: 'skip',
        type: Number,
        required: false,
        description: 'Controls the number of elements to be skipped (for paging)',
        default: 0,
    })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('managers')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAllForManagers(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<ProgramDto[]> {
        return this.programsService.findAllForManagers(limit, skip)
    }

    @ApiOperation({ summary: 'Finds program by id', description: 'Finds program by id.' })
    @ApiResponse({ status: HttpStatus.OK, type: StudentProgramDto, description: 'Got program successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @Get('/:id')
    @UseGuards(JwtAuthGuard)
    findOneForStudents(@Param('id') id: string): Promise<StudentProgramDto> {
        return this.programsService.findOneForStudents(id)
    }

    @ApiOperation({
        summary: 'Finds program by id (enriched for managers)',
        description: 'Finds program by id. (enriched for managers)',
    })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, description: 'Got program successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('managers/:id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOneForManagers(@Param('id') id: string): Promise<ProgramDto> {
        return this.programsService.findOneForManagers(id)
    }

    @ApiOperation({ summary: 'Updates a program', description: 'Updates a program.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put('managers/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto): Promise<void> {
        return this.programsService.update(id, updateProgramDto)
    }

    @ApiOperation({ summary: 'Deletes a program', description: 'Deletes a program.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Delete('managers/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    remove(@Param('id') id: string): Promise<void> {
        return this.programsService.remove(id)
    }
}
