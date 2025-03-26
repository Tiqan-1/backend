import { ObjectId } from '../repository/types'

export function isPopulated<T>(item: T | ObjectId): item is T {
    return !(item instanceof ObjectId)
}

export function arePopulated<T>(items: T[] | ObjectId[]): items is T[] {
    return items && items.length > 0 && isPopulated(items[0])
}

export function areNotPopulated<T>(items: T[] | ObjectId[]): items is ObjectId[] {
    return !arePopulated(items)
}
