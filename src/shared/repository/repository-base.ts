export abstract class RepositoryBase<T> {
    abstract create(element: object): Promise<T>
    abstract findAll(): Promise<T[]>
    abstract findOne(filter: object): Promise<T | undefined>
    abstract update(filter: object, element: T): Promise<T | undefined>
    abstract remove(filter: object): Promise<boolean>
}
