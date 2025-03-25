import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Level, LevelDocument } from './schemas/level.schema'

@Injectable()
export class LevelsRepository extends RepositoryMongoBase<LevelDocument> {
    constructor(@InjectModel(Level.name) model: Model<LevelDocument>) {
        super(model)
    }
}
