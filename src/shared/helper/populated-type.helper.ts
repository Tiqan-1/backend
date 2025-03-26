import { ObjectId, Populated } from '../repository/types'

export function isPopulated<T>(items: Populated<T> | ObjectId): items is Populated<T> {
    return typeof items !== 'string'
}

export function arePopulated<T>(items: Populated<T[]> | ObjectId[]): items is Populated<T[]> {
    return items && items.length > 0 && typeof items[0] !== 'string'
}

export function areNotPopulated<T>(items: Populated<T[]> | ObjectId[]): items is ObjectId[] {
    return items && items.length > 0 && typeof items[0] === 'string'
}
