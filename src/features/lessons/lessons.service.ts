import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
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

    @HandleBsonErrors()
    async validateLessonIds(lessonIds: string[]): Promise<ObjectId[]> {
        const lessonsObjectIds = lessonIds.map(id => new ObjectId(id))
        const lessons = await this.repository.findManyByIds(lessonsObjectIds)
        if (!lessons || lessons.length !== lessonIds.length) {
            throw new BadRequestException('some lessons not found with the given lessonIds')
        }
        return lessonsObjectIds
    }

    @HandleBsonErrors()
    async remove(lessonId: string): Promise<void> {
        await this.repository.remove(new ObjectId(lessonId))
    }

    @HandleBsonErrors()
    async update(id: string, lesson: UpdateLessonDto): Promise<void> {
        const updated = await this.repository.update({ _id: new ObjectId(id) }, { lesson })
        if (!updated) {
            throw new NotFoundException('Task not found.')
        }
    }
}
