import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto } from '../lessons/dto/lesson.dto'
import { LessonsService } from '../lessons/lessons.service'
import { LessonDocument } from '../lessons/schemas/lesson.schema'
import { CreateSubjectDto, SearchSubjectQueryDto, SubjectDto, UpdateSubjectDto } from './dto/subject.dto'
import { SubjectState } from './enums/subject-state'
import { SubjectDocument } from './schemas/subject.schema'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    private readonly logger = new Logger(SubjectsService.name)

    constructor(
        private readonly subjectsRepository: SubjectsRepository,
        private readonly lessonsService: LessonsService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async createForManager(subject: CreateSubjectDto, createdBy: ObjectId): Promise<CreatedDto> {
        const createDocument = { ...subject, createdBy }
        const created = await this.subjectsRepository.create(createDocument)
        this.logger.log(`Subject ${created._id.toString()} created by ${createdBy.toString()}.`)
        return { id: created._id.toString() }
    }

    async create(subject: CreateSubjectDto, createdBy: ObjectId): Promise<CreatedDto> {
        const createDocument = { ...subject, createdBy }
        const { _id } = await this.subjectsRepository.create(createDocument)
        const manager = await this.documentsService.getManager(createdBy.toString())
        if (!manager) {
            this.logger.error(`Illegal state: Manager ${createdBy.toString()} is logged in but not found in db.`)
            throw new InternalServerErrorException('Manager not found.')
        }
        ;(manager.subjects as ObjectId[]).push(_id)
        await manager.save()
        this.logger.log(`Subject ${_id.toString()} created by ${createdBy.toString()}.`)
        return { id: _id.toString() }
    }

    async find(searchSubjectQueryDto: SearchSubjectQueryDto, userObjectId: ObjectId): Promise<SubjectDto[]> {
        const filter = SearchFilterBuilder.init()
            .withObjectId('_id', searchSubjectQueryDto.id)
            .withObjectId('createdBy', userObjectId)
            .withStringLike('name', searchSubjectQueryDto.name)
            .withStringLike('description', searchSubjectQueryDto.description)
            .build()

        const found = await this.subjectsRepository.find(filter)
        return SubjectDto.fromDocuments(found)
    }

    async findOne(id: string): Promise<SubjectDto> {
        const subject = await this.loadSubject(id)
        await subject.populate(['lessons', { path: 'createdBy', select: 'name email' }])
        return SubjectDto.fromDocument(subject)
    }

    async createLesson(dto: CreateLessonDto, createdBy: ObjectId): Promise<CreatedDto> {
        return await this.lessonsService.create(dto, createdBy)
    }

    async getLessons(id: string): Promise<LessonDto[]> {
        const subject = await this.loadSubject(id)
        await subject.populate('lessons')
        return LessonDto.fromDocuments(subject.lessons as LessonDocument[])
    }

    async removeLesson(subjectId: string, lessonId: string): Promise<void> {
        const subject = await this.loadSubject(subjectId)
        const lessonIndex = subject.lessons.findIndex(id => id._id.toString() === lessonId)
        if (lessonIndex === -1) {
            this.logger.error(`Attempt to remove lesson ${lessonId} from subject ${subjectId} failed.`)
            throw new NotFoundException('Lesson not found.')
        }
        ;(subject.lessons as ObjectId[]).splice(lessonIndex, 1)
        await this.lessonsService.removeForSubjects(lessonId)
        await subject.save()
    }

    async loadSubject(id: string): Promise<SubjectDocument> {
        const subject = await this.subjectsRepository.findById(new ObjectId(id))
        if (!subject) {
            this.logger.error(`Attempt to find subject ${id} failed.`)
            throw new NotFoundException('Subject not found.')
        }
        return subject
    }

    async removeForManager(subjectId: string): Promise<void> {
        const removed = await this.subjectsRepository.update({ _id: new ObjectId(subjectId) }, { state: SubjectState.deleted })
        if (!removed) {
            this.logger.error(`Attempt to remove subject ${subjectId} failed.`)
            throw new NotFoundException('Subject not found.')
        }
        this.logger.log(`Subject ${subjectId} removed.`)
    }

    async remove(subjectId: string, managerObjectId: ObjectId): Promise<void> {
        const managerId = managerObjectId.toString()
        const manager = await this.documentsService.getManager(managerId)
        if (!manager) {
            this.logger.error(`Illegal state: Manager ${managerId} is logged in but not found in db.`)
            throw new InternalServerErrorException('Manager not found.')
        }
        const subjectIndex = manager.subjects.findIndex(subject => subject._id.toString() === subjectId)
        if (subjectIndex === -1) {
            this.logger.error(`Attempt to remove subject ${subjectId} from manager ${managerId} failed.`)
            throw new NotFoundException('Subject not found in the managers subjects.')
        }
        ;(manager.subjects as ObjectId[]).splice(subjectIndex, 1)
        await manager.save()
        const removed = await this.subjectsRepository.update({ _id: new ObjectId(subjectId) }, { state: SubjectState.deleted })
        if (!removed) {
            this.logger.error(`Attempt to remove subject ${subjectId} failed.`)
            throw new NotFoundException('Subject not found.')
        }
        for (const lesson of removed.lessons as ObjectId[]) {
            try {
                await this.lessonsService.removeForSubjects(lesson._id.toString())
            } catch (error) {
                this.logger.error(`Attempt to remove lesson ${lesson._id.toString()} from subject ${subjectId} failed.`, error)
            }
        }
        this.logger.log(`Subject ${subjectId} removed.`)
    }

    async update(id: string, dto: UpdateSubjectDto, managerObjectId: ObjectId): Promise<void> {
        const managerId = managerObjectId.toString()
        const manager = await this.documentsService.getManager(managerId)
        if (!manager) {
            this.logger.error(`Illegal state: Manager ${managerId} is logged in but not found in db.`)
            throw new InternalServerErrorException('Manager not found.')
        }
        const subject = manager.subjects.find(subject => subject._id.toString() === id)
        if (!subject) {
            this.logger.error(`Attempt to update subject ${id} from manager ${managerId} failed.`)
            throw new NotFoundException('Subject not found in the managers subjects.')
        }
        const updated = await this.subjectsRepository.update({ _id: new ObjectId(id), state: { $ne: SubjectState.deleted } }, dto)
        if (!updated) {
            this.logger.error(`Attempt to update subject ${id} failed.`)
            throw new NotFoundException(`Subject not found.`)
        }
    }
}
