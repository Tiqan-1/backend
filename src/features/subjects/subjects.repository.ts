import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Subject, SubjectDocument } from './schemas/subject.schema'

@Injectable()
export class SubjectsRepository extends RepositoryMongoBase<SubjectDocument> {
    constructor(@InjectModel(Subject.name) subjectModel: Model<SubjectDocument>) {
        super(subjectModel)
    }
}
