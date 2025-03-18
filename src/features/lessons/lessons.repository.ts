import { Injectable } from '@nestjs/common'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { LessonDocument } from './schemas/lesson.schema'

@Injectable()
export class LessonsRepository extends RepositoryMongoBase<LessonDocument> {}
