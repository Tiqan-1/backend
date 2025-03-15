import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '../../shared/enums/role.enum'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsService } from './subjects.service'

@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: 'Creates a subject.' })
    @ApiResponse({ status: 201, type: SubjectDto })
    @Post()
    @Roles(Role.Manager)
    @ApiHeader({ name: 'Authorization', required: true })
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() subject: CreateSubjectDto): Promise<SubjectDto> {
        return this.service.create(subject)
    }
}
