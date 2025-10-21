import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Permission, PermissionDocument } from './schemas/permission.schema'

@Injectable()
export class PermissionsRepository extends RepositoryMongoBase<PermissionDocument> {
    constructor(@InjectModel(Permission.name) permissionModel: Model<PermissionDocument>) {
        super(permissionModel)
    }
}
