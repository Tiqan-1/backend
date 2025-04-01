import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto } from '../lessons/dto/lesson.dto'
import { LessonsService } from '../lessons/lessons.service'
import { LessonDocument } from '../lessons/schemas/lesson.schema'
import { CreateSubjectDto, SubjectDto, UpdateSubjectDto } from './dto/subject.dto'
import { SubjectDocument } from './schemas/subject.schema'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(
        private readonly subjectsRepository: SubjectsRepository,
        private readonly lessonsService: LessonsService
    ) {}

    async create(subject: CreateSubjectDto, createdBy: ObjectId): Promise<CreatedDto> {
        const createDocument = { ...subject, createdBy }
        const created = await this.subjectsRepository.create(createDocument)
        return { id: created._id.toString() }
    }

    async findAll(limit?: number, skip?: number): Promise<SubjectDto[]> {
        const result = await this.subjectsRepository.findAll(limit, skip)
        return SubjectDto.fromDocuments(result)
    }

    async findOne(id: string): Promise<SubjectDto> {
        const subject = await this.loadSubject(id)
        await subject.populate(['lessons', { path: 'createdBy', select: 'name email' }])
        return SubjectDto.fromDocument(subject)
    }

    async createLesson(subjectId: string, dto: CreateLessonDto): Promise<CreatedDto> {
        const subject = await this.loadSubject(subjectId)
        const created = await this.lessonsService.create(dto)
        ;(subject.lessons as ObjectId[]).push(new ObjectId(created.id))
        await subject.save()
        return created
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
            throw new NotFoundException('Lesson not found.')
        }
        ;(subject.lessons as ObjectId[]).splice(lessonIndex, 1)
        await this.lessonsService.remove(lessonId)
        await subject.save()
    }

    async loadSubject(id: string): Promise<SubjectDocument> {
        const subject = await this.subjectsRepository.findById(new ObjectId(id))
        if (!subject) {
            throw new NotFoundException('Subject not found.')
        }
        return subject
    }

    async remove(subjectId: string): Promise<void> {
        await this.subjectsRepository.remove({ _id: new ObjectId(subjectId) })
    }

    async update(id: string, dto: UpdateSubjectDto): Promise<void> {
        const updated = await this.subjectsRepository.update({ _id: new ObjectId(id) }, dto)
        if (!updated) {
            throw new NotFoundException('Task not found.')
        }
    }
}
