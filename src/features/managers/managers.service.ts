import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { CreateProgramDto, ProgramDto } from '../programs/dto/program.dto'
import { ProgramsService } from '../programs/programs.service'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { CreateSubjectDto, SubjectDto } from '../subjects/dto/subject.dto'
import { SubjectDocument } from '../subjects/schemas/subject.schema'
import { SubjectsService } from '../subjects/subjects.service'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'
import { ManagerDocument } from './schemas/manager.schema'

@Injectable()
export class ManagersService {
    constructor(
        private managersRepository: ManagersRepository,
        private authenticationService: AuthenticationService,
        private subjectsService: SubjectsService,
        private programsService: ProgramsService
    ) {}

    async create(manager: SignUpManagerDto): Promise<AuthenticationResponseDto> {
        const duplicate = await this.managersRepository.findOne({ email: manager.email })
        if (duplicate) {
            throw new ConflictException('A user with the same email already exists.')
        }
        try {
            manager.password = bcrypt.hashSync(manager.password, 10)
            const createdManager = await this.managersRepository.create(manager)
            return this.authenticationService.generateUserTokens(createdManager)
        } catch (error) {
            console.error('General Error while creating manager.', error)
            throw new InternalServerErrorException('General Error while creating manager.')
        }
    }

    async createSubject(id: ObjectId, subject: CreateSubjectDto): Promise<CreatedDto> {
        const manager = await this.loadManager(id)
        const created = await this.subjectsService.create(subject, id)
        ;(manager.subjects as ObjectId[]).push(new ObjectId(created.id))
        await manager.save()
        return created
    }

    async getSubjects(id: ObjectId): Promise<SubjectDto[]> {
        const manager = await this.loadManager(id)
        await manager.populate({ path: 'subjects', populate: ['lessons', { path: 'createdBy', select: 'name email' }] })
        return SubjectDto.fromDocuments(manager.subjects as SubjectDocument[])
    }

    async removeSubject(managerId: ObjectId, subjectId: string): Promise<void> {
        const manager = await this.loadManager(managerId)
        const subjectIndex = manager.subjects.findIndex(id => id._id.toString() === subjectId)
        if (subjectIndex === -1) {
            throw new NotFoundException('Subject not found.')
        }
        ;(manager.subjects as ObjectId[]).splice(subjectIndex, 1)
        await this.subjectsService.remove(subjectId)
        await manager.save()
    }

    async createProgram(id: ObjectId, createProgramDto: CreateProgramDto, programPicture?: File): Promise<CreatedDto> {
        const manager = await this.loadManager(id)
        const created = await this.programsService.create(createProgramDto, id, programPicture)
        ;(manager.programs as ObjectId[]).push(new ObjectId(created.id))
        await manager.save()
        return created
    }

    async getPrograms(id: ObjectId): Promise<ProgramDto[]> {
        const manager = await this.loadManager(id)
        await manager.populate('programs')
        return ProgramDto.fromDocuments(manager.programs as ProgramDocument[])
    }

    async removeProgram(managerId: ObjectId, programId: string): Promise<void> {
        const manager = await this.loadManager(managerId)
        const programIndex = manager.programs.findIndex(id => id._id.toString() === programId)
        if (programIndex === -1) {
            throw new NotFoundException('Program not found.')
        }
        ;(manager.programs as ObjectId[]).splice(programIndex, 1)
        await this.programsService.remove(programId)
        await manager.save()
    }

    private async loadManager(id: ObjectId): Promise<ManagerDocument> {
        const manager = await this.managersRepository.findById(id)
        if (!manager) {
            throw new InternalServerErrorException(`Manager document not found.`)
        }
        return manager
    }
}
