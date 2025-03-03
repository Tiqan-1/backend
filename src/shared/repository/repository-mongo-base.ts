import { Model } from 'mongoose'
import { RepositoryBase } from './repository-base'

export class RepositoryMongoBase<T, E> extends RepositoryBase<T, E> {
    constructor(protected model: Model<T>) {
        super()
    }

    async create(element: E): Promise<void> {
        const createdElement = new this.model(element)
        await createdElement.save()
    }

    findAll(): Promise<T[]> {
        return this.model.find().exec()
    }

    async findOne(filter: object): Promise<T | undefined> {
        const foundElement = await this.model.findOne({ ...filter }).exec()
        if (foundElement) {
            return foundElement
        }
        return undefined
    }

    async update(filter: object, element: T): Promise<T | undefined> {
        const result = await this.model.replaceOne({ ...filter }, element).exec()
        if (result.matchedCount === 1) {
            return element
        }
        return undefined
    }

    async remove(filter: object): Promise<boolean> {
        const result = await this.model.deleteOne({ ...filter }).exec()
        return result.deletedCount === 1
    }
}
