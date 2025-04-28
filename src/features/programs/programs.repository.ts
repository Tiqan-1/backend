import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { Program, ProgramDocument } from './schemas/program.schema'

@Injectable()
export class ProgramsRepository extends RepositoryMongoBase<ProgramDocument> {
    constructor(@InjectModel(Program.name) model: Model<ProgramDocument>) {
        super(model)
    }

    async find(filter: object, limit: number = 10, skip: number = 0): Promise<ProgramDocument[]> {
        return this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'createdBy', select: 'name email' })
            .populate({ path: 'levels', populate: { path: 'tasks', populate: 'lessons' } })
            .exec()
    }

    async findById(id: ObjectId): Promise<ProgramDocument | undefined> {
        const found = await this.model
            .findById(id)
            .populate({ path: 'createdBy', select: 'name email' })
            .populate({ path: 'levels', populate: { path: 'tasks', populate: 'lessons' } })
            .exec()
        if (found) {
            return found
        }
        return undefined
    }

    async findAll(limit = 10, skip = 0): Promise<ProgramDocument[]> {
        return this.model
            .find()
            .limit(limit)
            .skip(skip)
            .populate({ path: 'createdBy', select: 'name email' })
            .populate({ path: 'levels', populate: { path: 'tasks', populate: 'lessons' } })
            .exec()
    }
}
