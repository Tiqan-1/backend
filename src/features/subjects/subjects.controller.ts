import { Body, Controller, Get, HttpStatus, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: 'Creates a subject.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: SubjectDto, description: 'Subject successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<SubjectDto> {
        return this.service.create(subject, request.user)
    }

    @ApiOperation({ summary: 'Finds all subjects created by user', description: 'Finds all subjects created by user.' })
    @ApiResponse({ status: 200, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('user')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAllForUser(@Request() request: { user: TokenUser }): Promise<SubjectDto[]> {
        return this.service.findAllByManagerId(request.user)
    }

    @ApiOperation({ summary: 'Finds all subjects', description: 'Finds all subjects.' })
    @ApiResponse({ status: 200, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(): Promise<SubjectDto[]> {
        return this.service.findAll()
    }

    @ApiOperation({ summary: 'Finds subject by id', description: 'Finds subject by id.' })
    @ApiResponse({ status: 200, type: SubjectDto, description: 'Got subject successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(): Promise<SubjectDto[]> {
        return this.service.findAll()
    }
}
