import { MultipartFile } from '@fastify/multipart'
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
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

    async createForManager(createProgramDto: CreateProgramDto, createdBy: ObjectId): Promise<CreatedDto> {
        const levels =
            createProgramDto.levelIds &&
            (await this.documentsService.getLevels(createProgramDto.levelIds))?.map(level => level._id)
        const document = CreateProgramDto.toDocument(createProgramDto, createdBy)
        const createObject = levels ? { ...document, levels } : { ...document }
        const created = await this.programsRepository.create(createObject)
        this.logger.log(`Program ${created.id} created by ${createdBy.toString()}.`)
        return { id: created._id.toString() }
    }

    async create(createProgramDto: CreateProgramDto, createdBy: ObjectId): Promise<CreatedDto> {
        const levels =
            createProgramDto.levelIds &&
            (await this.documentsService.getLevels(createProgramDto.levelIds))?.map(level => level._id)
        const document = CreateProgramDto.toDocument(createProgramDto, createdBy)
        const createObject = levels ? { ...document, levels } : { ...document }
        const created = await this.programsRepository.create(createObject)
        const managerId = createdBy.toString()
        const manager = await this.documentsService.getManager(managerId)
        ;(manager?.programs as ObjectId[]).push(created._id)
        await manager?.save()
        this.logger.log(`Program ${created.id} created by ${managerId}.`)
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

    async find(searchProgramQueryDto: SearchProgramQueryDto, searchUserId: ObjectId): Promise<ProgramDto[]> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', searchProgramQueryDto.id)
            .withObjectId('createdBy', searchUserId)
            .withParam('state', searchProgramQueryDto.state)
            .withStringLike('name', searchProgramQueryDto.name)
            .withStringLike('description', searchProgramQueryDto.description)
            .withDateAfter('start', searchProgramQueryDto.start)
            .withDateBefore('end', searchProgramQueryDto.end)
            .withDateAfter('registrationStart', searchProgramQueryDto.registrationStart)
            .withDateBefore('registrationEnd', searchProgramQueryDto.registrationEnd)
            .build()
        const limit = searchProgramQueryDto.limit ?? 20
        const skip = searchProgramQueryDto.skip ?? 0

        const result = await this.programsRepository.find(filter, limit, skip)
        await this.loadThumbnails(result)
        return ProgramDto.fromDocuments(result)
    }

    /** @deprecated */
    async findOne(id: string): Promise<ProgramDto> {
        const found = await this.loadProgram(id)
        await this.loadThumbnail(found)
        return ProgramDto.fromDocument(found)
    }

    async update(id: string, updateProgramDto: UpdateProgramDto, managerObjectId: ObjectId): Promise<void> {
        const managerId = managerObjectId.toString()
        const manager = await this.documentsService.getManager(managerId)
        if (!manager) {
            this.logger.error(`Illegal state: Manager ${managerId} is logged in but not found in db.`)
            throw new InternalServerErrorException('Manager not found.')
        }
        const program = manager.programs.find(program => program._id.toString() === id)
        if (!program) {
            this.logger.error(`Attempt to update program ${id} by manager ${managerId} failed. Program not found`)
            throw new NotFoundException('Program not found.')
        }
        const programId = new ObjectId(id)
        const updateObject = UpdateProgramDto.toDocument(updateProgramDto)
        const updated = await this.programsRepository.update({ _id: programId }, updateObject)
        if (!updated) {
            this.logger.error(`Attempt to update program ${id} failed.`)
            throw new NotFoundException('Program not found.')
        }
    }

    async removeForManager(id: string): Promise<void> {
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

    async remove(id: string, managerObjectId: ObjectId): Promise<void> {
        const managerId = managerObjectId.toString()
        const manager = await this.documentsService.getManager(managerId)
        if (!manager) {
            this.logger.error(`Illegal state: Manager ${managerId} is logged in but not found in db.`)
            throw new InternalServerErrorException('Manager not found.')
        }
        const programIndex = manager.programs.findIndex(program => program._id.toString() === id)
        if (programIndex === -1) {
            this.logger.error(`Attempt to remove program ${id} from manager ${managerId} failed.`)
            throw new NotFoundException('Program not found in the managers programs.')
        }
        ;(manager.programs as ObjectId[]).splice(programIndex, 1)
        await manager.save()
        const found = await this.programsRepository.update(
            { _id: new ObjectId(id) },
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
            try {
                await this.levelsService.remove(level._id.toString())
            } catch (error) {
                this.logger.error(`Attempt to remove level ${level._id.toString()} from program ${id} failed.`, error)
            }
        }
        this.logger.log(`Program ${id} removed.`)
    }

    /** @deprecated */
    async createLevel(programId: string, createLevelDto: CreateLevelDto, createdBy: ObjectId): Promise<CreatedDto> {
        return await this.levelsService.create({ ...createLevelDto, programId }, createdBy)
    }

    /** @deprecated */
    async getLevels(id: string): Promise<LevelDto[]> {
        const program = await this.loadProgram(id)
        await program.populate({ path: 'levels', populate: { path: 'tasks', populate: { path: 'lessons' } } })
        return LevelDto.fromDocuments(program.levels as LevelDocument[])
    }

    /** @deprecated */
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

    /** @deprecated */
    private async loadProgram(id: string): Promise<ProgramDocument> {
        const program = await this.programsRepository.findById(new ObjectId(id))
        if (!program || program.state === ProgramState.deleted) {
            this.logger.error(`Attempt to find program ${id} failed.`, program)
            throw new NotFoundException('Program not found')
        }
        return program
    }
}
