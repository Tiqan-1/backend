import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Subject, SubjectDocument } from './schemas/subject.schema'

@Injectable()
export class SubjectsRepository extends RepositoryMongoBase<SubjectDocument> {
    constructor(@InjectModel(Subject.name) subjectModel: Model<SubjectDocument>) {
        super(subjectModel)
    }

    async create(element: unknown): Promise<SubjectDocument> {
        const createdElement = new this.model(element)
        await createdElement.save()

        return (await this.findOne({ _id: createdElement._id })) as SubjectDocument
    }

    async findOne(filter: object): Promise<SubjectDocument | undefined> {
        const foundDocument: SubjectDocument | null = await this.model
            .findOne(filter)
            .populate('createdBy', 'name email')
            .populate('lessons')
            .exec()
        if (!foundDocument) {
            return undefined
        }
        return foundDocument
    }

    findAllByManagerId(managerId: Types.ObjectId): Promise<SubjectDocument[]> {
        return this.model.find({ createdBy: managerId }).populate('createdBy', 'name email').populate('lessons').exec()
    }
}
