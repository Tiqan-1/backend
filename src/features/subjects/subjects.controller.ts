import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateSubjectDto, SearchSubjectQueryDto, UpdateSubjectDto } from './dto/subject.dto'
import { PaginatedSubjectDto } from './paginated-subject.dto'
import { SubjectsService } from './subjects.service'

@ApiBearerAuth()
@Controller('api/subjects')
export class SubjectsController {
    constructor(private readonly service: SubjectsService) {}

    @ApiOperation({ summary: 'Creates a subject', description: `Creates a subject and adds it to the current manager.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Subject successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    create(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.service.create(subject, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for subjects', description: 'Searches for subjects.' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedSubjectDto, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    find(
        @Query() searchSubjectQueryDto: SearchSubjectQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedSubjectDto> {
        return this.service.find(searchSubjectQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Updates a subject', description: 'Updates a subject.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() dto: UpdateSubjectDto, @Request() request: { user: TokenUser }): Promise<void> {
        return this.service.update(id, dto, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a subject', description: 'Removes a subject from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @Delete(':subjectId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    remove(@Request() request: { user: TokenUser }, @Param('subjectId') subjectId: string): Promise<void> {
        return this.service.remove(subjectId, request.user.id)
    }
}
