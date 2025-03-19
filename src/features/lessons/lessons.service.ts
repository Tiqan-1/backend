import { Injectable } from '@nestjs/common'
import { CreateLessonDto, LessonDto } from './dto/lesson.dto'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    constructor(private readonly repository: LessonsRepository) {}

    async create(lesson: CreateLessonDto): Promise<LessonDto> {
        const lessonDocument = await this.repository.create(lesson)
        return LessonDto.fromDocument(lessonDocument)
    }
}
