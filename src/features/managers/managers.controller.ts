import { FileInterceptor } from '@nest-lab/fastify-multer'
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PhotoFilePipe } from '../../shared/pipes/photo.file.pipe'
import { Roles } from '../authentication/decorators/roles.decorator'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { CreateProgramDto, ProgramDto } from '../programs/dto/program.dto'
import { CreateSubjectDto, SubjectDto } from '../subjects/dto/subject.dto'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersService } from './managers.service'

@Controller('api/managers')
export class ManagersController {
    constructor(private readonly managersService: ManagersService) {}

    @ApiOperation({ summary: 'Signs a manager-user up', description: 'Signs a manager-user up and returns the created user.' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.', type: AuthenticationResponseDto })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A user with the same email address already exists.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    signUp(@Body() signUpManagerDto: SignUpManagerDto): Promise<AuthenticationResponseDto> {
        return this.managersService.create(signUpManagerDto)
    }

    @ApiOperation({ summary: 'Creates a subject', description: `Creates a subject and adds it to the manager.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Subject successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @Post('subjects')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    createSubject(@Body() subject: CreateSubjectDto, @Request() request: { user: TokenUser }): Promise<CreatedDto> {
        return this.managersService.createSubject(request.user.id, subject)
    }

    @ApiOperation({ summary: 'Gets subjects of the manager', description: `Gets subjects of the manager.` })
    @ApiResponse({ status: HttpStatus.OK, type: SubjectDto, isArray: true, description: 'Got subjects successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('subjects')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getSubjects(@Request() request: { user: TokenUser }): Promise<SubjectDto[]> {
        return this.managersService.getSubjects(request.user.id)
    }

    @ApiOperation({ summary: 'Removes a subject', description: 'Removes a subject from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subject successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subject not found.' })
    @Delete('subjects/:subjectId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeSubject(@Request() request: { user: TokenUser }, @Param('subjectId') subjectId: string): Promise<void> {
        return this.managersService.removeSubject(request.user.id, subjectId)
    }

    @ApiOperation({ summary: 'Creates a program', description: `Creates a program and adds it to the manager.` })
    @ApiResponse({ status: HttpStatus.CREATED, type: CreatedDto, description: 'Program successfully created.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Program photo validation failed.' })
    @ApiConsumes('multipart/form-data')
    @Post('programs')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('programPicture'))
    createProgram(
        @Body() createProgramDto: CreateProgramDto,
        @Request() request: { user: TokenUser },
        @UploadedFile(new PhotoFilePipe())
        programPicture?: File
    ): Promise<CreatedDto> {
        return this.managersService.createProgram(request.user.id, createProgramDto, programPicture)
    }

    @ApiOperation({ summary: 'Gets programs of the manager', description: `Gets programs of the manager.` })
    @ApiResponse({ status: HttpStatus.OK, type: ProgramDto, isArray: true, description: 'Got programs successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @Get('programs')
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    getPrograms(@Request() request: { user: TokenUser }): Promise<ProgramDto[]> {
        return this.managersService.getPrograms(request.user.id)
    }

    @ApiOperation({ summary: 'Removes a program', description: 'Removes a program from the manager.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Program successfully removed.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Program not found.' })
    @Delete('programs/:programId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(Role.Manager)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeProgram(@Request() request: { user: TokenUser }, @Param('programId') programId: string): Promise<void> {
        return this.managersService.removeProgram(request.user.id, programId)
    }
}
