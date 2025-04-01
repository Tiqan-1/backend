import { Injectable, NotFoundException } from '@nestjs/common'
import { ObjectId } from '../../shared/repository/types'
import { CreateLessonDto, LessonDto, UpdateLessonDto } from './dto/lesson.dto'
import { LessonsRepository } from './lessons.repository'

@Injectable()
export class LessonsService {
    constructor(private readonly repository: LessonsRepository) {}

    async create(lesson: CreateLessonDto): Promise<LessonDto> {
        const lessonDocument = await this.repository.create(lesson)
        return LessonDto.fromDocument(lessonDocument)
    }

    async remove(lessonId: string): Promise<void> {
        await this.repository.remove(new ObjectId(lessonId))
    }

    async update(id: string, lesson: UpdateLessonDto): Promise<void> {
        const updated = await this.repository.update({ _id: new ObjectId(id) }, lesson)
        if (!updated) {
            throw new NotFoundException('Task not found.')
        }
    }
}
