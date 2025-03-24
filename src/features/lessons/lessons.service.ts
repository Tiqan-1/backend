import { BadRequestException, Injectable } from '@nestjs/common'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto } from './dto/lesson.dto'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    constructor(private readonly repository: LessonsRepository) {}

    async create(lesson: CreateLessonDto): Promise<LessonDto> {
        const lessonDocument = await this.repository.create(lesson)
        return LessonDto.fromDocument(lessonDocument)
    }

    async hasLesson(id: ObjectId): Promise<boolean> {
        const lesson = await this.repository.findById(id)
        return !!lesson
    }

    async validateLessonIds(lessonIds: string[]): Promise<ObjectId[]> {
        const lessonsObjectIds = lessonIds.map(id => new ObjectId(id))
        const lessons = await this.repository.findManyByIds(lessonsObjectIds)
        if (!lessons || lessons.length !== lessonIds.length) {
            throw new BadRequestException('some lessons not found with the given lessonIds')
        }
        return lessonsObjectIds
    }
}
