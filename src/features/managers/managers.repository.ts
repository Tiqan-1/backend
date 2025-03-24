import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ObjectId } from 'src/shared/repository/types'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Manager, ManagerDocument } from './schemas/manager.schema'

@Injectable()
export class ManagersRepository extends RepositoryMongoBase<ManagerDocument> {
    constructor(@InjectModel(Manager.name) managerModel: Model<ManagerDocument>) {
        super(managerModel)
    }

    async findPopulatedById(_id: ObjectId): Promise<ManagerDocument | undefined> {
        const found = await this.model.findById(_id).populate('programs').populate('subjects')
        if (found) {
            return found
        }
    }
}
