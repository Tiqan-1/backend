import { Types } from 'mongoose'

export type Populated<T> = T extends Types.ObjectId ? Record<string, unknown> : T

export type ObjectId = Types.ObjectId
export const ObjectId = Types.ObjectId
