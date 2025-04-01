import { MultipartFile } from '@fastify/multipart'
import { Injectable, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { CreateLevelDto, LevelDto } from '../levels/dto/level.dto'
import { LevelsService } from '../levels/levels.service'
import { LevelDocument } from '../levels/schemas/level.schema'
import { CreateProgramDto, ProgramDto, StudentProgramDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramsRepository } from './programs.repository'
import { ProgramsThumbnailsRepository } from './programs.thumbnails.repository'
import { ProgramDocument } from './schemas/program.schema'

@Injectable()
export class ProgramsService {
    constructor(
        private readonly programsRepository: ProgramsRepository,
        private readonly programsThumbnailsRepository: ProgramsThumbnailsRepository,
        private readonly levelsService: LevelsService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(createProgramDto: CreateProgramDto, createdBy: ObjectId): Promise<CreatedDto> {
        const levels = (await this.documentsService.getLevels(createProgramDto.levelIds))?.map(level => level._id)
        const document = CreateProgramDto.toDocument(createProgramDto, createdBy)
        const createObject = levels ? { ...document, levels } : { ...document }
        const created = await this.programsRepository.create(createObject)
        return { id: created._id.toString() }
    }

    async updateThumbnail(id: string, uploaded: MultipartFile): Promise<void> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.findById(programId)
        if (found?.thumbnail) {
            await this.programsThumbnailsRepository.remove(found.thumbnail)
        }
        const thumbnail = await this.programsThumbnailsRepository.create(uploaded)
        await this.programsRepository.update({ _id: id }, { thumbnail })
    }

    async findAllForStudents(limit?: number, skip?: number): Promise<StudentProgramDto[]> {
        const now = new Date()
        const filter = { state: 'published', registrationStart: { $lt: now }, registrationEnd: { $gt: now } }
        const foundPrograms = await this.programsRepository.find(filter, limit, skip)
        await this.loadThumbnails(foundPrograms)
        return StudentProgramDto.fromDocuments(foundPrograms)
    }

    async findAllForManagers(limit?: number, skip?: number): Promise<ProgramDto[]> {
        const foundPrograms = await this.programsRepository.findAll(limit, skip)
        await this.loadThumbnails(foundPrograms)
        return ProgramDto.fromDocuments(foundPrograms)
    }

    async findOneForManagers(id: string): Promise<ProgramDto> {
        const found = await this.loadProgram(id)
        await this.loadThumbnail(found)
        return ProgramDto.fromDocument(found)
    }

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

    async remove(id: string): Promise<void> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.findById(programId)
        if (!found) {
            throw new NotFoundException('Program not found.')
        }
        if (found.thumbnail) {
            await this.programsThumbnailsRepository.remove(found.thumbnail)
        }
        await this.programsRepository.remove({ _id: programId })
    }

    async createLevel(programId: string, createLevelDto: CreateLevelDto): Promise<CreatedDto> {
        const program = await this.loadProgram(programId)
        const level = await this.levelsService.create(createLevelDto)
        ;(program.levels as ObjectId[]).push(new ObjectId(level.id))
        await program.save()
        return level
    }

    async getLevels(id: string): Promise<LevelDto[]> {
        const program = await this.loadProgram(id)
        await program.populate({ path: 'levels', populate: { path: 'tasks', populate: { path: 'lessons' } } })
        return LevelDto.fromDocuments(program.levels as LevelDocument[])
    }

    async removeLevel(programId: string, levelId: string): Promise<void> {
        const program = await this.loadProgram(programId)
        const levelIndex = program.levels.findIndex(id => id._id.toString() === levelId)
        if (levelIndex === -1) {
            throw new NotFoundException('Level not found.')
        }
        ;(program.levels as ObjectId[]).splice(levelIndex, 1)
        await this.levelsService.remove(levelId)
        await program.save()
    }

    private async loadThumbnails(foundPrograms: ProgramDocument[]): Promise<void> {
        for (const program of foundPrograms) {
            await this.loadThumbnail(program)
        }
    }

    private async loadThumbnail(program: ProgramDocument): Promise<void> {
        if (program.thumbnail) {
            program.thumbnail = await this.programsThumbnailsRepository.findOne(program.thumbnail)
        }
    }

    private async loadProgram(id: string): Promise<ProgramDocument> {
        const program = await this.programsRepository.findById(new ObjectId(id))
        if (!program) {
            throw new NotFoundException('Program not found')
        }
        return program
    }
}
