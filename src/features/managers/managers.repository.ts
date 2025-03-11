import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Manager, ManagerDocument } from './schemas/manager.schema'

@Injectable()
export class ManagersRepository extends RepositoryMongoBase<ManagerDocument> {
    constructor(@InjectModel(Manager.name) managerModel: Model<ManagerDocument>) {
        super(managerModel)
    }
}
