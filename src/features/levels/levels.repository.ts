import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { Level, LevelDocument } from './schemas/level.schema'

@Injectable()
export class LevelsRepository extends RepositoryMongoBase<LevelDocument> {
    constructor(@InjectModel(Level.name) model: Model<LevelDocument>) {
        super(model)
    }

    async find(filter: object, limit: number = 10, skip: number = 0): Promise<LevelDocument[]> {
        return await this.model
            .find(filter)
            .limit(limit)
            .skip(skip)
            .populate({ path: 'tasks', populate: { path: 'lessons' } })
            .populate('createdBy', 'name email')
            .exec()
    }

    async findById(id: ObjectId): Promise<LevelDocument | undefined> {
        const found = await this.model
            .findById(id)
            .populate({ path: 'tasks', populate: { path: 'lessons' } })
            .exec()
        if (found) {
            return found
        }
        return undefined
    }
}
