import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { HydratedDocument, Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { PopulatedUser } from '../users/types/user.types'
import { Assignment, AssignmentDocument } from './schemas/assignment.schema'

export type PopulatedAssignmentDocument = HydratedDocument<Assignment> & PopulatedUser

@Injectable()
export class AssignmentsRepository extends RepositoryMongoBase<AssignmentDocument> {
    constructor(@InjectModel(Assignment.name) model: Model<AssignmentDocument>) {
        super(model)
    }

    find(filter: object, limit: number = 10, skip: number = 0): Promise<PopulatedAssignmentDocument[]> {
        return this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'createdBy', select: 'name email' })
            .exec() as unknown as Promise<PopulatedAssignmentDocument[]>
    }

    async findRawById(id: ObjectId): Promise<AssignmentDocument | undefined> {
        const found = await this.model.findById(id).exec()
        if (found) {
            return found
        }
        return undefined
    }

    async findById(id: ObjectId): Promise<PopulatedAssignmentDocument | undefined> {
        const found = await this.model.findById(id).populate({ path: 'createdBy', select: 'name email' }).exec()
        if (found) {
            return found as unknown as PopulatedAssignmentDocument
        }
        return undefined
    }
}
