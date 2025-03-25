import { Model, Types } from 'mongoose'
import { RepositoryBase } from './repository-base'

export class RepositoryMongoBase<T> extends RepositoryBase<T> {
    constructor(protected model: Model<T>) {
        super()
    }

    async create(element: unknown): Promise<T> {
        const createdElement = new this.model(element)
        return (await createdElement.save()) as T
    }

    findAll(limit = 10, skip = 0): Promise<T[]> {
        return this.model.find().limit(limit).skip(skip).exec()
    }

    findManyByIds(ids: Types.ObjectId[]): Promise<T[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }

    async findOne(filter: object): Promise<T | undefined> {
        const foundElement = await this.model.findOne({ ...filter }).exec()
        if (foundElement) {
            return foundElement
        }
        return undefined
    }

    async findById(id: Types.ObjectId): Promise<T | undefined> {
        const foundElement = await this.model.findById(id).exec()
        if (foundElement) {
            return foundElement
        }
        return undefined
    }

    async update(filter: object, updateElement: object): Promise<T | undefined> {
        const result = await this.model.findOneAndUpdate({ ...filter }, { $set: { ...updateElement } }, { new: true }).exec()
        if (result) {
            return result
        }
        return undefined
    }

    async remove(filter: object): Promise<boolean> {
        const result = await this.model.deleteOne({ ...filter }).exec()
        return result.deletedCount === 1
    }
}
