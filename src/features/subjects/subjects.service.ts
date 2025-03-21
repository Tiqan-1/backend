import { Injectable, NotFoundException } from '@nestjs/common'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { TokenUser } from '../authentication/types/token-user'
import { LessonsRepository } from '../lessons/lessons.repository'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(
        private readonly subjectsRepository: SubjectsRepository,
        private readonly lessonsRepository: LessonsRepository
    ) {}

    @HandleBsonErrors()
    async create(subject: CreateSubjectDto, manager: TokenUser): Promise<SubjectDto> {
        const document = CreateSubjectDto.toDocument(subject, manager.id)
        const result = await this.subjectsRepository.create(document)
        return SubjectDto.fromDocument(result)
    }

    @HandleBsonErrors()
    async addLessonToSubject(subjectId: string, lessonId: string): Promise<void> {
        const lesson = await this.lessonsRepository.findOne({ _id: new ObjectId(lessonId) })
        const subject = await this.subjectsRepository.findOne({ _id: new ObjectId(subjectId) })
        if (!subject || !lesson) {
            throw new NotFoundException('Subject or Lesson not found.')
        }
        subject.lessons.push(lesson)
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
