import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto, SearchLessonsQueryDto, UpdateLessonDto } from './dto/lesson.dto'
import { PaginatedLessonDto } from './dto/paginated-lesson.dto'
import { LessonState } from './enums/lesson-state.enum'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    private readonly logger = new Logger(LessonsService.name)

    constructor(
        private readonly repository: LessonsRepository,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(lesson: CreateLessonDto, createdBy: ObjectId): Promise<CreatedDto> {
        const subject = await this.documentsService.getSubject(lesson.subjectId)
        if (!subject) {
            this.logger.error(`Tried to create a lesson for subject ${lesson.subjectId} which does not exist.`)
            throw new NotFoundException(`Subject not found`)
        }
        const created = await this.repository.create({ ...lesson, createdBy, subjectId: subject._id })
        ;(subject.lessons as ObjectId[]).push(created._id)
        await subject.save()
        const createdId = created._id.toString()
        this.logger.log(`Lesson ${createdId} created.`)
        return { id: createdId }
    }

    async removeForSubjects(lessonId: string): Promise<void> {
        const deleted = await this.repository.update({ _id: new ObjectId(lessonId) }, { state: LessonState.deleted })
        if (!deleted) {
            this.logger.error(`Attempt to remove lesson ${lessonId} failed.`)
            throw new NotFoundException(`Lesson not found`)
        }
        this.logger.log(`Lesson ${lessonId} removed.`)
    }

    async remove(lessonId: string): Promise<void> {
        const deleted = await this.repository.update({ _id: new ObjectId(lessonId) }, { state: LessonState.deleted })
        if (!deleted) {
            this.logger.error(`Attempt to remove lesson ${lessonId} failed. Lesson not found in the db.`)
            throw new NotFoundException(`Lesson not found`)
        }
        const subjectId = deleted.subjectId.toString()
        const subject = await this.documentsService.getSubject(subjectId)
        if (!subject) {
            this.logger.warn(`Lesson ${lessonId} removed successfully, but its subject was not found.`)
            return
        }
        const lessonIndex = subject.lessons.findIndex(id => id._id.toString() === lessonId)
        if (lessonIndex === -1) {
            this.logger.warn(
                `Lesson ${lessonId} removed successfully, but its subject didn't have this lesson in its lessons array.`
            )
            return
        }
        ;(subject.lessons as ObjectId[]).splice(lessonIndex, 1)
        await subject.save()
        this.logger.log(`Lesson ${lessonId} removed.`)
    }

    async update(id: string, lesson: UpdateLessonDto): Promise<void> {
        const updated = await this.repository.update({ _id: new ObjectId(id), state: { $ne: LessonState.deleted } }, lesson)
        if (!updated) {
            this.logger.error(`Attempt to update lesson ${id} failed.`)
            throw new NotFoundException('Lesson not found.')
        }
    }

    async validateLessonIds(lessonIds: string[]): Promise<ObjectId[]> {
        const objectIds = lessonIds.map(lessonId => new ObjectId(lessonId))
        const lessons = await this.repository.findActiveByIds(objectIds)
        if (lessons.length < lessonIds.length) {
            const missingLessons = objectIds.filter(id => !lessons.some(lesson => lesson._id === id))
            this.logger.error(`Attempt to validate lessonIds failed, some lessons were not found.`, missingLessons)
            throw new NotFoundException('Lesson not found.')
        }
        return objectIds
    }

    async find(query: SearchLessonsQueryDto, createdBy: ObjectId): Promise<PaginatedLessonDto> {
        let subjectLessons: ObjectId[] | undefined
        if (query.subjectId) {
            const subject = await this.documentsService.getSubject(query.subjectId)
            if (!subject?.lessons.length || !createdBy.equals(subject.createdBy as ObjectId)) {
                this.logger.warn(`Subject ${query.subjectId} not found or has no lessons.`)
                return PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            subjectLessons = subject.lessons as ObjectId[]
        }
        const filterBuilder = SearchFilterBuilder.init()

        if (query.id) {
            if (subjectLessons && !subjectLessons.some(id => id.equals(query.id))) {
                this.logger.warn(`Lesson ${query.id} requested but not found within subject ${query.subjectId}.`)
                PaginationHelper.emptyResponse(query.page, query.pageSize)
            }
            filterBuilder.withObjectId('_id', query.id)
        } else if (subjectLessons) {
            filterBuilder.withObjectIds('_id', subjectLessons)
        }

        filterBuilder
            .withObjectId('createdBy', createdBy)
            .withStringLike('title', query.title)
            .withExactString('type', query.type)
            .withStringLike('url', query.url)

        const filter = filterBuilder.build()
        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [lessons, total] = await Promise.all([
            this.repository.find(filter, query.pageSize, skip),
            this.repository.countDocuments(filter),
        ])
        return PaginationHelper.wrapResponse(LessonDto.fromDocuments(lessons), query.page, query.pageSize, total)
    }
}
