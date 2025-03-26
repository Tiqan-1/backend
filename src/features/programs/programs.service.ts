import { Injectable, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { ManagersService } from '../managers/managers.service'
import { CreateProgramDto, ProgramDto, StudentProgramDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramState } from './enums/program-state.enum'
import { ProgramsRepository } from './programs.repository'

@Injectable()
export class ProgramsService {
    constructor(
        private readonly programsRepository: ProgramsRepository,
        private readonly managersService: ManagersService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(createProgramDto: CreateProgramDto, creatorId: ObjectId): Promise<CreatedDto> {
        const levels = (await this.documentsService.getLevels(createProgramDto.levelIds))?.map(level => level._id)
        const document = CreateProgramDto.toDocument(createProgramDto)
        const createObject = levels ? { ...document, levels } : { ...document }
        const created = await this.programsRepository.create(createObject)

        await this.managersService.addProgram(creatorId, created)

        return { id: created._id.toString() }
    }

    @HandleBsonErrors()
    async findAllForStudents(limit?: number, skip?: number): Promise<StudentProgramDto[]> {
        const filter = { state: { $in: [ProgramState.published] } }
        const foundPrograms = await this.programsRepository.find(filter, limit, skip)
        if (!foundPrograms) {
            return []
        }
        return StudentProgramDto.fromDocuments(foundPrograms)
    }

    @HandleBsonErrors()
    async findAllForManagers(limit?: number, skip?: number): Promise<ProgramDto[]> {
        const foundPrograms = await this.programsRepository.findAll(limit, skip)
        return ProgramDto.fromDocuments(foundPrograms)
    }

    @HandleBsonErrors()
    async findOneForStudents(id: string): Promise<StudentProgramDto> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.findById(programId)
        if (!found) {
            throw new NotFoundException('Program not found')
        }
        return StudentProgramDto.fromDocument(found)
    }

    @HandleBsonErrors()
    async findOneForManagers(id: string): Promise<ProgramDto> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.findById(programId)
        if (!found) {
            throw new NotFoundException('Program not found')
        }
        return ProgramDto.fromDocument(found)
    }

    @HandleBsonErrors()
    async update(id: string, updateProgramDto: UpdateProgramDto): Promise<void> {
        const programId = new ObjectId(id)
        const levels = await this.documentsService.getLevels(updateProgramDto.levelIds)
        const document = UpdateProgramDto.toDocument(updateProgramDto)
        const updateObject = levels ? { ...document, levels } : { ...document }
        const updated = await this.programsRepository.update({ _id: programId }, updateObject)
        if (!updated) {
            throw new NotFoundException('Program not found')
        }
    }

    @HandleBsonErrors()
    async remove(id: string): Promise<void> {
        const programId = new ObjectId(id)
        const deleted = await this.programsRepository.remove({ _id: programId })
        if (!deleted) {
            throw new NotFoundException('Task not found.')
        }
    }

    @HandleBsonErrors()
    async addLevel(programId: string, level: ObjectId): Promise<void> {
        const found = await this.programsRepository.findById(new ObjectId(programId))
        if (!found) {
            throw new NotFoundException('Program not found')
        }
        ;(found.levels as ObjectId[]).push(level)
        await found.save()
    }
}
