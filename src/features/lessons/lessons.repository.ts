import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Lesson, LessonDocument } from './schemas/lesson.schema'

@Injectable()
export class LessonsRepository extends RepositoryMongoBase<LessonDocument> {
    constructor(@InjectModel(Lesson.name) model: Model<LessonDocument>) {
        super(model)
    }

    findManyByIds(lessonIds: Types.ObjectId[]): Promise<LessonDocument[]> {
        return this.model.find({ _id: { $in: lessonIds } }).exec()
    }
}
