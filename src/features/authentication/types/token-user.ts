import { Types } from 'mongoose'
import { Role } from '../enums/role.enum'

export type TokenUser = {
    id: Types.ObjectId
    role: Role
}
