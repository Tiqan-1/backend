import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { Subject, SubjectDocument } from './schemas/subject.schema'

@Injectable()
export class SubjectsRepository extends RepositoryMongoBase<SubjectDocument> {
    constructor(@InjectModel(Subject.name) subjectModel: Model<SubjectDocument>) {
        super(subjectModel)
    }

    async create(element: unknown): Promise<SubjectDocument> {
        const createdElement = new this.model(element)
        await createdElement.save()

        // called to populate createdBy and lessons
        return (await this.findById(createdElement._id)) as SubjectDocument
    }

    async findById(id: ObjectId): Promise<SubjectDocument | undefined> {
        const foundDocument: SubjectDocument | null = await this.model
            .findById(id)
            .populate('createdBy', 'name email')
            .populate({ path: 'lessons' })
            .exec()
        if (!foundDocument) {
            return undefined
        }
        return foundDocument
    }

    findAll(limit = 10, skip = 0): Promise<SubjectDocument[]> {
        return this.model.find().populate('createdBy', 'name email').populate('lessons').limit(limit).skip(skip).exec()
    }

    async find(filter: object, limit = 10, skip = 0): Promise<SubjectDocument[]> {
        return this.model.find(filter).populate('createdBy', 'name email').populate('lessons').limit(limit).skip(skip).exec()
    }
}
