import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema'

@Injectable()
export class SubscriptionsRepository extends RepositoryMongoBase<SubscriptionDocument> {
    constructor(@InjectModel(Subscription.name) model: Model<SubscriptionDocument>) {
        super(model)
    }

    async findByIdPopulated(id: ObjectId): Promise<SubscriptionDocument | undefined> {
        const found = await this.model
            .findById(id)
            .populate('program')
            .populate({ path: 'level', populate: { path: 'tasks', populate: { path: 'lessons' } } })
            .exec()
        if (!found) {
            return undefined
        }
        return found
    }

    findManyByIdsPopulated(ids: ObjectId[]): Promise<SubscriptionDocument[]> {
        return this.model
            .find({ _id: { $in: ids } })
            .populate('program')
            .populate({ path: 'level', populate: { path: 'tasks', populate: { path: 'lessons' } } })
            .exec()
    }
}
