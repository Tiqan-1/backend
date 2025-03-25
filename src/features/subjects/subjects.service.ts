import { Injectable, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { TokenUser } from '../authentication/types/token-user'
import { ManagersService } from '../managers/managers.service'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(
        private readonly subjectsRepository: SubjectsRepository,
        private readonly managersService: ManagersService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    @HandleBsonErrors()
    async create(subject: CreateSubjectDto, manager: TokenUser): Promise<CreatedDto> {
        const document = CreateSubjectDto.toDocument(subject, manager.id)
        const created = await this.subjectsRepository.create(document)
        await this.managersService.addSubject(manager.id, created)
        return { id: created._id.toString() }
    }

    async addLessonToSubject(subjectId: string, lessonId: string): Promise<void> {
        const lesson = await this.documentsService.getLesson(lessonId)
        const subject = await this.documentsService.getSubject(subjectId)
        if (!subject || !lesson) {
            throw new NotFoundException('Subject or Lesson not found.')
        }
        ;(subject.lessons as ObjectId[]).push(lesson._id)
        await subject.save()
    }

    @HandleBsonErrors()
    async findAllByManagerId(manager: TokenUser, limit?: number, skip?: number): Promise<SubjectDto[]> {
        const result = await this.subjectsRepository.findAllByManagerId(manager.id, limit, skip)
        return SubjectDto.fromDocuments(result)
    }

    async findAll(limit?: number, skip?: number): Promise<SubjectDto[]> {
        const result = await this.subjectsRepository.findAll(limit, skip)
        return SubjectDto.fromDocuments(result)
    }

    @HandleBsonErrors()
    async findOne(id: string): Promise<SubjectDto> {
        const result = await this.subjectsRepository.findOne({ _id: new ObjectId(id) })
        if (!result) {
            throw new NotFoundException('Subject not found with the given Id')
        }
        return SubjectDto.fromDocument(result)
    }
}
