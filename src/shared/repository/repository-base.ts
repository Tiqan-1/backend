import { Types } from 'mongoose'

export abstract class RepositoryBase<T> {
    abstract create(element: object): Promise<T>
    abstract findAll(): Promise<T[]>
    abstract findOne(filter: object): Promise<T | undefined>
    abstract findManyByIds(ids: Types.ObjectId[]): Promise<T[]>
    abstract findById(id: unknown): Promise<T | undefined>
    abstract update(filter: object, updateElement: object): Promise<T | undefined>
    abstract remove(filter: object): Promise<boolean>
}
