import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentResponse, AssignmentResponseDocument } from './schemas/assignment-response.schema'

@Injectable()
export class AssignmentResponsesRepository extends RepositoryMongoBase<AssignmentResponseDocument> {
    constructor(@InjectModel(AssignmentResponse.name) model: Model<AssignmentResponseDocument>) {
        super(model)
    }

    async updateMany(filter: object, update: object): Promise<void> {
        await this.model.updateMany(filter, update).exec()
    }

    async find(filter: object, limit: number = 10, skip: number = 0): Promise<AssignmentResponseDocument[]> {
        return this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'studentId', select: 'name' })
            .populate({ path: 'assignmentId', select: 'title' })
            .sort({ submittedAt: 1 })
            .exec()
    }

    async findById(id: ObjectId, populated = false): Promise<AssignmentResponseDocument | undefined> {
        const found = populated
            ? await this.model.findById(id).populate({ path: 'assignment' }).populate({ path: 'student', select: 'name email' })
            : await super.findById(id)
        if (found) {
            return found
        }
        return undefined
    }

    async findAll(limit = 10, skip = 0): Promise<AssignmentResponseDocument[]> {
        return this.model
            .find()
            .limit(limit)
            .skip(skip)
            .populate({ path: 'studentId', select: 'name' })
            .populate({ path: 'assignmentId', select: 'title' })
            .exec()
    }
}
