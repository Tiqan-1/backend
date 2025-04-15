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
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { CreateLevelDto, LevelDto } from '../levels/dto/level.dto'
import { ProgramDto, SearchProgramQueryDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramState } from './enums/program-state.enum'
import { ProgramsService } from './programs.service'
import { ThumbnailValidator } from './validators/thumbnail.validator'

@ApiBearerAuth()
@Controller('api/programs')
export class ProgramsController {
    private readonly logger = new Logger(ProgramsController.name)

    constructor(private readonly programsService: ProgramsService) {}

    @ApiOperation({
        summary: 'Finds all programs (enriched for managers)',
        description: 'Finds all programs (enriched for managers)',
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
    @Get('enriched')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    findAllForManagers(@Query('limit') limit?: number, @Query('skip') skip?: number): Promise<ProgramDto[]> {
        return this.programsService.findAllForManagers(limit, skip)
    }

    @ApiOperation({
        summary: 'Searches for programs',
        description: 'Searches for programs (enriched for managers)',
    })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('search')
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    search(@Query() searchProgramQueryDto: SearchProgramQueryDto): Promise<ProgramDto[]> {
        return this.programsService.findForManagers(searchProgramQueryDto)
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
    @Get('enriched/:id')
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
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto): Promise<void> {
        if (updateProgramDto.state === ProgramState.deleted) {
            this.logger.error(`Attempt to update state of program to deleted.`)
            throw new BadRequestException('Cannot update state to deleted, use the right endpoint to delete the program.')
        }
        return this.programsService.update(id, updateProgramDto)
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

    @ApiOperation({ summary: 'Creates a level', description: 'Creates a level and adds it to the program.' })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Level successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Post(':programId/levels')
    @HttpCode(HttpStatus.CREATED)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    createLevel(@Body() createLevelDto: CreateLevelDto, @Param('programId') programId: string): Promise<CreatedDto> {
        return this.programsService.createLevel(programId, createLevelDto)
    }

    @ApiOperation({ summary: 'Gets levels of the program', description: `Gets levels of the program.` })
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

    @ApiOperation({ summary: 'Removes a level', description: 'Removes a level from the program.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Level successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Delete(':programId/levels/:levelId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeProgram(@Param('levelId') levelId: string, @Param('programId') programId: string): Promise<void> {
        return this.programsService.removeLevel(programId, levelId)
    }
}
