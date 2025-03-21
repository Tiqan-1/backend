import { ObjectId } from '../../../shared/repository/types'
import { Role } from '../enums/role.enum'

export type TokenUser = {
    id: ObjectId
    role: Role
}
