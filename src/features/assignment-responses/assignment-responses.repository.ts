import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PopulateOptions } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { AssignmentResponse, AssignmentResponseDocument } from './schemas/assignment-response.schema'

@Injectable()
export class AssignmentResponsesRepository extends RepositoryMongoBase<AssignmentResponseDocument> {
    constructor(@InjectModel(AssignmentResponse.name) model: Model<AssignmentResponseDocument>) {
        super(model)
    }

    
    async updateMany(filter: object, update: object): Promise<any> {
        return this.model.updateMany(filter, update).exec();
    }

    //
    //
    //
    //
    // === SEARCH ===
    //
    //
    //
    //
    async find(filter: object, limit: number = 10, skip: number = 0): Promise<AssignmentResponseDocument[]> {
        return this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'studentId', select: 'name' })
            .populate({ path: 'assignmentId', select: 'title'})
            .sort({ submittedAt: 1 })
            .exec()
    }

    //
    //
    //
    //
    // === FIND BY ID ===
    //
    //
    //
    //
    async findOneById(id: ObjectId | string, ...populateOptions: PopulateOptions[]): Promise<AssignmentResponseDocument | null> {
        let query = this.model.findById(id);

        if (populateOptions.length > 0) {
            populateOptions.forEach(option => {
                query = query.populate(option);
            });
        }
        
        return query.exec();
    }

    // unused
    // async findById(id: ObjectId): Promise<AssignmentResponseDocument | undefined> {
    //     const found = await this.model
    //         .findById(id)
    //         .populate({ path: 'studentId', select: 'name' })
    //         .populate({ path: 'assignmentId', select: 'title'})
    //         .exec()
    //     if (found) {
    //         return found
    //     }
    //     return undefined
    // }


    

    //
    //
    //
    //
    // === PAGINATE ASSIGNMENTRESPONSES ===
    //
    //
    //
    //
    async findAll(limit = 10, skip = 0): Promise<AssignmentResponseDocument[]> {
        return this.model
            .find()
            .limit(limit)
            .skip(skip)
            .populate({ path: 'studentId', select: 'name' })
            .populate({ path: 'assignmentId', select: 'title'})
            .exec()
    }
}
