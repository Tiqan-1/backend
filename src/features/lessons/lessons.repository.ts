import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Lesson, LessonDocument } from './schemas/lesson.schema'

@Injectable()
export class LessonsRepository extends RepositoryMongoBase<LessonDocument> {
    constructor(@InjectModel(Lesson.name) subjectModel: Model<LessonDocument>) {
        super(subjectModel)
    }
}
