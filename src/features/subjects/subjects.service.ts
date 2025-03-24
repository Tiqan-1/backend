import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { arePopulated } from '../../shared/helper/populated-type.helper'
import { ObjectId } from '../../shared/repository/types'
import { TokenUser } from '../authentication/types/token-user'
import { LessonsService } from '../lessons/lessons.service'
import { ManagersService } from '../managers/managers.service'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(
        private readonly subjectsRepository: SubjectsRepository,
        private readonly lessonsService: LessonsService,
        private readonly managersService: ManagersService
    ) {}

    @HandleBsonErrors()
    async create(subject: CreateSubjectDto, manager: TokenUser): Promise<CreatedDto> {
        const document = CreateSubjectDto.toDocument(subject, manager.id)
        const created = await this.subjectsRepository.create(document)
        await this.managersService.addSubject(manager.id, created)
        return { id: created._id.toString() }
    }

    @HandleBsonErrors()
    async addLessonToSubject(subjectId: string, lessonId: string): Promise<void> {
        const lessonObjectId = new ObjectId(lessonId)
        const hasLesson = await this.lessonsService.hasLesson(lessonObjectId)
        const subject = await this.subjectsRepository.findById(new ObjectId(subjectId))
        if (!subject || !hasLesson) {
            throw new NotFoundException('Subject or Lesson not found.')
        }
        if (arePopulated(subject.lessons)) {
            throw new InternalServerErrorException(`Subject's lessons are unexpectedly populated`)
        }
        subject.lessons.push(lessonObjectId)
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
