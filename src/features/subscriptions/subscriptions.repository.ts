import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { SubscriptionState } from './enums/subscription-state.enum'
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema'

@Injectable()
export class SubscriptionsRepository extends RepositoryMongoBase<SubscriptionDocument> {
    constructor(@InjectModel(Subscription.name) model: Model<SubscriptionDocument>) {
        super(model)
    }

    findRaw(filter: Record<string, unknown>): Promise<SubscriptionDocument[]> {
        return this.model.find(filter).exec()
    }

    find(filter: Record<string, unknown>, limit = 20, skip = 0): Promise<SubscriptionDocument[]> {
        return this.model
            .find(filter)
            .populate({
                path: 'program',
                populate: [
                    { path: 'createdBy', select: '_id name email' },
                    {
                        path: 'levels',
                        populate: [
                            { path: 'tasks', populate: { path: 'lessons' } },
                            { path: 'createdBy', select: 'name email' },
                        ],
                    },
                ],
            })
            .populate({
                path: 'level',
                populate: [
                    { path: 'tasks', populate: { path: 'lessons' } },
                    { path: 'createdBy', select: 'name email' },
                ],
            })
            .populate({ path: 'subscriber', select: 'name email' })
            .limit(limit)
            .skip(skip)
            .exec()
    }

    async findById(id: ObjectId): Promise<SubscriptionDocument | undefined> {
        const found = await this.model
            .findById(id)
            .populate('program')
            .populate({ path: 'level', populate: { path: 'tasks', populate: { path: 'lessons' } } })
            .populate({ path: 'subscriber', select: 'name email' })
            .exec()
        if (!found) {
            return undefined
        }
        return found
    }

    findManyByIds(ids: ObjectId[], limit = 10, skip = 0): Promise<SubscriptionDocument[]> {
        return this.model
            .find({ _id: { $in: ids }, state: { $ne: SubscriptionState.deleted } })
            .populate('program')
            .populate({ path: 'level', populate: { path: 'tasks', populate: { path: 'lessons' } } })
            .populate({ path: 'subscriber', select: 'name email' })
            .limit(limit)
            .skip(skip)
            .exec()
    }
}
