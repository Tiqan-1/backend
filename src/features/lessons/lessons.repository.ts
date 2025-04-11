import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { LessonState } from './enums/lesson-state.enum'
import { Lesson, LessonDocument } from './schemas/lesson.schema'

@Injectable()
export class LessonsRepository extends RepositoryMongoBase<LessonDocument> {
    constructor(@InjectModel(Lesson.name) model: Model<LessonDocument>) {
        super(model)
    }

    findActiveByIds(ids: ObjectId[]): Promise<LessonDocument[]> {
        return this.model.find({ _id: { $in: ids }, state: LessonState.active }).exec()
    }
}
