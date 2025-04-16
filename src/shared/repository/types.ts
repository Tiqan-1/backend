import { Types } from 'mongoose'

export type ObjectId = Types.ObjectId
export const ObjectId = Types.ObjectId

export type Populated<T> = T extends ObjectId ? Record<string, unknown> : T
