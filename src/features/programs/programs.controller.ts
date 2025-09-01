import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    Put,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { diskStorage } from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { CreatedDto } from '../../shared/dto/created.dto'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { PaginatedProgramDto } from './dto/paginated-program.dto'
import { CreateProgramDto, SearchProgramQueryDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramState } from './enums/program-state.enum'
import { ProgramsService } from './programs.service'
import { ProgramsThumbnailsRepository } from './programs.thumbnails.repository'

@ApiBearerAuth()
@Controller('api/programs')
export class ProgramsController {
    private readonly logger = new Logger(ProgramsController.name)

    constructor(
        private readonly programsService: ProgramsService,
        private readonly thumbnailsRepository: ProgramsThumbnailsRepository
    ) {}

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

    @ApiOperation({ summary: 'Searches for programs', description: 'Searches for programs' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedProgramDto, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user,' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get()
    @UseGuards(JwtAuthGuard)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    find(
        @Query() searchProgramQueryDto: SearchProgramQueryDto,
        @Request() request: { user: TokenUser }
    ): Promise<PaginatedProgramDto> {
        return this.programsService.find(searchProgramQueryDto, request.user.id)
    }

    @ApiOperation({ summary: 'Updates a program', description: 'Updates a program.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Published program has no levels.' })
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
    @UseInterceptors(
        FileInterceptor('thumbnail', {
            limits: { fileSize: 5 * 1024 * 1024, files: 1 },
            storage: diskStorage({
                destination: './uploads/programs-thumbnails',
                filename: (_, file, callback) => callback(null, `${uuidv4()}-${file.originalname}`),
            }),
        })
    )
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addThumbnail(
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
                    new FileTypeValidator({ fileType: 'image/png', skipMagicNumbersValidation: true }),
                ],
            })
        )
        thumbnail: Express.Multer.File
    ): Promise<void> {
        this.logger.log(`Adding thumbnail ${thumbnail.filename} for program ${id}`)
        return this.programsService.updateThumbnail(id, thumbnail.filename).catch(async () => {
            await this.thumbnailsRepository.remove(thumbnail.filename)
        })
    }
}
