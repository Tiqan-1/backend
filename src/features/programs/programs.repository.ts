import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Program, ProgramDocument } from './schemas/program.schema'

@Injectable()
export class ProgramsRepository extends RepositoryMongoBase<ProgramDocument> {
    constructor(@InjectModel(Program.name) model: Model<ProgramDocument>) {
        super(model)
    }

    async find(filter: object, limit: number = 20, skip: number = 0): Promise<ProgramDocument[] | undefined> {
        const found = await this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'levels', populate: { path: 'tasks', populate: 'lessons' } })
            .exec()
        if (found) {
            return found
        }
    }
}
