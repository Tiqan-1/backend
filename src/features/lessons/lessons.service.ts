import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonState } from './enums/lesson-state.enum'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    private readonly logger = new Logger(LessonsService.name)

    constructor(private readonly repository: LessonsRepository) {}

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
}
