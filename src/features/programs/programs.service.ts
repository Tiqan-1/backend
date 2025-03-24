import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { CreateProgramDto, ProgramDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramsRepository } from './programs.repository'

@Injectable()
export class ProgramsService {
    constructor(private readonly programsRepository: ProgramsRepository) {}

    @HandleBsonErrors()
    async create(createProgramDto: CreateProgramDto, creatorId: ObjectId): Promise<CreatedDto> {
        const document = CreateProgramDto.toDocument(createProgramDto, creatorId)
        const created = await this.programsRepository.create(document)
        return { id: created._id.toString() }
    }

    @HandleBsonErrors()
    async findAll(limit?: number, skip?: number): Promise<ProgramDto[]> {
        const foundPrograms = await this.programsRepository.findAll(limit, skip)
        return ProgramDto.fromDocuments(foundPrograms)
    }

    @HandleBsonErrors()
    async findOne(id: string): Promise<ProgramDto> {
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
        const updateObject = UpdateProgramDto.toDocument(updateProgramDto)
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
}
