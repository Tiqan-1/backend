import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Post,
    Put,
    Query,
    Req,
    Request,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateLevelDto, LevelDto } from '../levels/dto/level.dto'
import { CreateProgramDto, ProgramDto, SearchProgramQueryDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramState } from './enums/program-state.enum'
import { ProgramsService } from './programs.service'
import { ThumbnailValidator } from './validators/thumbnail.validator'

@ApiBearerAuth()
@Controller('api/programs')
export class ProgramsController {
    private readonly logger = new Logger(ProgramsController.name)

    constructor(private readonly programsService: ProgramsService) {}

    @ApiOperation({ summary: 'Creates a program', description: `Creates a program and adds it to the current manager.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Program successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post()
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    create(@Body() createProgramDto: CreateProgramDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.programsService.create(createProgramDto, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for programs', description: 'Searches for programs', deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('enriched')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    oldSearch(
        @Query() searchProgramQueryDto: SearchProgramQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<ProgramDto[]> {
        return this.programsService.find(searchProgramQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Searches for programs', description: 'Searches for programs' })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    find(@Query() searchProgramQueryDto: SearchProgramQueryDto, @Request() request: { user: TokenUser }): Promise<ProgramDto[]> {
        return this.programsService.find(searchProgramQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Finds program by id', description: 'Finds program by id.', deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, description: 'Got program successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('enriched/:id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOneOld(@Param('id') id: string): Promise<ProgramDto> {
        return this.programsService.findOne(id)
    }

    @ApiOperation({ summary: 'Finds program by id', description: 'Finds program by id.', deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, description: 'Got program successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':id')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findOne(@Param('id') id: string): Promise<ProgramDto> {
        return this.programsService.findOne(id)
    }

    @ApiOperation({ summary: 'Updates a program', description: 'Updates a program.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(
        @Param('id') id: string,
        @Body() updateProgramDto: UpdateProgramDto,
        @Request() request: { user: TokenUser }
    ): Promise<void> {
        if (updateProgramDto.state === ProgramState.deleted) {
            this.logger.error(`Attempt to update state of program to deleted.`)
            throw new BadRequestException('Cannot update state to deleted, use the right endpoint to delete the program.')
        }
        return this.programsService.update(id, updateProgramDto, request.user.id)
    }

    @ApiOperation({ summary: 'Removes a program', description: 'Removes a program from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Delete(':programId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    remove(@Request() request: { user: TokenUser }, @Param('programId') programId: string): Promise<void> {
        return this.programsService.remove(programId, request.user.id)
    }

    @ApiOperation({ summary: 'Uploads a thumbnail', description: 'Uploads a thumbnail for the program.' })
    @ApiBody({
        required: true,
        schema: {
            type: 'object',
            properties: {
                thumbnail: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['thumbnail'],
        },
    })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Thumbnail successfully uploaded.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Thumbnail validation failed.' })
    @ApiConsumes('multipart/form-data')
    @Post(':id/thumbnail')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addThumbnail(@Param('id') id: string, @Req() req: FastifyRequest): Promise<void> {
        const thumbnail = await req.file()
        if (ThumbnailValidator.validate(thumbnail)) {
            return this.programsService.updateThumbnail(id, thumbnail)
        }
    }

    @ApiOperation({ summary: 'Creates a level', description: 'Creates a level and adds it to the program.', deprecated: true })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Level successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Post(':programId/levels')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    createLevel(
        @Body() createLevelDto: CreateLevelDto,
        @Param('programId') programId: string,
        @Request() request: { user: TokenUser }
    ): Promise<CreatedDto> {
        return this.programsService.createLevel(programId, createLevelDto, request.user.id)
    }

    @ApiOperation({ summary: 'Gets levels of the program', description: `Gets levels of the program.`, deprecated: true })
    @ApiResponse({ status: HttpStatus.OK, type: LevelDto, isArray: true, description: 'Got levels successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get(':programId/levels')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getLevels(@Param('programId') programId: string): Promise<LevelDto[]> {
        return this.programsService.getLevels(programId)
    }

    @ApiOperation({ summary: 'Removes a level', description: 'Removes a level from the program.', deprecated: true })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Level successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Delete(':programId/levels/:levelId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeLevel(@Param('levelId') levelId: string, @Param('programId') programId: string): Promise<void> {
        return this.programsService.removeLevel(programId, levelId)
    }
}
