import { Model } from 'mongoose'
import { RepositoryBase } from './repository-base'

export class RepositoryMongoBase<T> extends RepositoryBase<T> {
    constructor(protected model: Model<T>) {
        super()
    }

    async create(element: unknown): Promise<T> {
        const createdElement = new this.model(element)
        return (await createdElement.save()) as T
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
