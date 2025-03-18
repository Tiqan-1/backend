import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '../../shared/enums/role.enum'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { TokenUser } from '../../shared/types/token-user'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: 'Creates a subject.' })
    @ApiResponse({ status: 201, type: SubjectDto })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<SubjectDto> {
        return this.service.create(subject, request.user)
    }

    @ApiOperation({ summary: 'Finds all subjects created by user', description: 'Finds all subjects created by user.' })
    @ApiResponse({ status: 201, type: SubjectDto, isArray: true })
    @Get()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAllForUser(@Request() request: { user: TokenUser }): Promise<SubjectDto[]> {
        return this.service.findAllByManagerId(request.user)
    }

    @ApiOperation({ summary: 'Finds all subjects created by user', description: 'Finds all subjects created by user.' })
    @ApiResponse({ status: 201, type: SubjectDto, isArray: true })
    @Get('all')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAll(): Promise<SubjectDto[]> {
        return this.service.findAll()
    }
}
