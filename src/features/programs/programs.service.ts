import { MultipartFile } from '@fastify/multipart'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { CreateLevelDto, LevelDto } from '../levels/dto/level.dto'
import { LevelsService } from '../levels/levels.service'
import { LevelDocument } from '../levels/schemas/level.schema'
import { CreateProgramDto, ProgramDto, SearchProgramQueryDto, StudentProgramDto, UpdateProgramDto } from './dto/program.dto'
import { ProgramState } from './enums/program-state.enum'
import { ProgramsRepository } from './programs.repository'
import { ProgramsThumbnailsRepository } from './programs.thumbnails.repository'
import { ProgramDocument } from './schemas/program.schema'

@Injectable()
export class ProgramsService {
    private readonly logger = new Logger(ProgramsService.name)

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
        this.logger.log(`Program ${created.id} created by ${createdBy.toString()}.`)
        return { id: created._id.toString() }
    }

    async updateThumbnail(id: string, uploaded: MultipartFile): Promise<void> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.findById(programId)
        if (found?.thumbnail) {
            await this.programsThumbnailsRepository.remove(found.thumbnail)
            this.logger.log(`Thumbnail ${found.thumbnail} removed.`)
        }
        const thumbnail = await this.programsThumbnailsRepository.create(uploaded)
        await this.programsRepository.update({ _id: id }, { thumbnail })
        this.logger.log(`Thumbnail ${uploaded.filename} added to Program ${id}.`)
    }

    async findAllForStudents(limit?: number, skip?: number): Promise<StudentProgramDto[]> {
        const now = new Date()
        const filter = { state: ProgramState.published, registrationStart: { $lt: now }, registrationEnd: { $gt: now } }
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
        if (updateProgramDto.state === ProgramState.deleted) {
            this.logger.error(`Attempt to update state of program to deleted.`)
            throw new BadRequestException('Cannot update state to deleted, use the right endpoint to delete the program.')
        }
        const updateObject = UpdateProgramDto.toDocument(updateProgramDto)
        const updated = await this.programsRepository.update({ _id: programId }, updateObject)
        if (!updated) {
            this.logger.error(`Attempt to update program ${id} failed.`)
            throw new NotFoundException('Program not found')
        }
    }

    async remove(id: string): Promise<void> {
        const programId = new ObjectId(id)
        const found = await this.programsRepository.update(
            { _id: programId },
            { state: ProgramState.deleted, expireAt: oneMonth }
        )
        if (!found) {
            this.logger.error(`Attempt to remove program ${id} failed.`)
            throw new NotFoundException('Program not found.')
        }
        if (found.thumbnail) {
            await this.programsThumbnailsRepository.remove(found.thumbnail)
            this.logger.log(`Thumbnail ${found.thumbnail} removed because program ${id} was removed.`)
        }

        for (const level of found.levels) {
            await this.levelsService.remove(level._id.toString())
        }
        this.logger.log(`Program ${id} removed.`)
    }

    async createLevel(programId: string, createLevelDto: CreateLevelDto): Promise<CreatedDto> {
        const program = await this.loadProgram(programId)
        const level = await this.levelsService.create(createLevelDto)
        ;(program.levels as ObjectId[]).push(new ObjectId(level.id))
        await program.save()
        this.logger.log(`Level ${level.id} created and added to Program ${programId}.`)
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
            this.logger.error(`Attempt to remove level ${levelId} from program ${programId} failed.`)
            throw new NotFoundException('Level not found.')
        }
        ;(program.levels as ObjectId[]).splice(levelIndex, 1)
        await this.levelsService.remove(levelId)
        this.logger.log(`Level ${levelId} removed from Program ${programId}.`)
        await program.save()
    }

    async loadThumbnails(foundPrograms: ProgramDocument[]): Promise<void> {
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
        if (!program || program.state === ProgramState.deleted) {
            this.logger.error(`Attempt to find program ${id} failed.`, program)
            throw new NotFoundException('Program not found')
        }
        return program
    }

    async findForManagers(searchProgramQueryDto: SearchProgramQueryDto): Promise<ProgramDto[]> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', searchProgramQueryDto.id)
            .withParam('state', searchProgramQueryDto.state)
            .withStringLike('name', searchProgramQueryDto.name)
            .withStringLike('description', searchProgramQueryDto.description)
            .withDateAfter('start', searchProgramQueryDto.start)
            .withDateBefore('end', searchProgramQueryDto.end)
            .withDateAfter('registrationStart', searchProgramQueryDto.registrationStart)
            .withDateBefore('registrationEnd', searchProgramQueryDto.registrationEnd)
            .build()

        const result = await this.programsRepository.find(filter, 10)
        await this.loadThumbnails(result)
        return ProgramDto.fromDocuments(result)
    }
}
