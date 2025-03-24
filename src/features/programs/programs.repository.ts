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
}
