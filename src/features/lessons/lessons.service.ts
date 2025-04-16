import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto, SearchLessonsQueryDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonState } from './enums/lesson-state.enum'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    private readonly logger = new Logger(LessonsService.name)

    constructor(
        private readonly repository: LessonsRepository,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async create(lesson: CreateLessonDto): Promise<LessonDto> {
        const lessonDocument = await this.repository.create(lesson)
        this.logger.log(`Lesson ${lessonDocument._id.toString()} created.`)
        return LessonDto.fromDocument(lessonDocument)
    }

    async remove(lessonId: string): Promise<void> {
        const deleted = await this.repository.update({ _id: new ObjectId(lessonId) }, { state: LessonState.deleted })
        if (!deleted) {
            this.logger.error(`Attempt to remove lesson ${lessonId} failed.`)
            throw new NotFoundException(`Lesson not found`)
        }
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

    async find(queryDto: SearchLessonsQueryDto): Promise<LessonDto[]> {
        let subjectLessons: ObjectId[] | undefined
        if (queryDto.subjectId) {
            const subject = await this.documentsService.getSubject(queryDto.subjectId)
            if (!subject?.lessons.length) {
                this.logger.warn(`Subject ${queryDto.subjectId} not found or has no lessons.`)
                return []
            }
            subjectLessons = subject.lessons as ObjectId[]
        }
        const filterBuilder = SearchFilterBuilder.init()

        if (queryDto.id) {
            if (subjectLessons && !subjectLessons.some(id => id.equals(queryDto.id))) {
                this.logger.warn(`Lesson ${queryDto.id} requested but not found within subject ${queryDto.subjectId}.`)
                return []
            }
            filterBuilder.withObjectId('_id', queryDto.id)
        } else if (subjectLessons) {
            filterBuilder.withObjectIds('_id', subjectLessons)
        }

        filterBuilder
            .withStringLike('title', queryDto.title)
            .withExactString('type', queryDto.type)
            .withStringLike('url', queryDto.url)

        const filter = filterBuilder.build()
        const limit = queryDto.limit
        const skip = queryDto.skip

        const lessons = await this.repository.find(filter, limit, skip)
        return LessonDto.fromDocuments(lessons)
    }
}
