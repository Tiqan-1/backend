import { Injectable } from '@nestjs/common'
import { ObjectId } from '../../shared/repository/types'
import { PermissionType } from './enums/permission.type.enum'
import { PermissionsRepository } from './permissions.repository'
import { PermissionDocument } from './schemas/permission.schema'

@Injectable()
export class PermissionsService {
    constructor(private readonly permissionsRepository: PermissionsRepository) {}

    async addPermission(userId: ObjectId, item: ObjectId, permission: PermissionType): Promise<void> {
        const found: PermissionDocument | undefined = await this.permissionsRepository.findOne({ userId, item })
        if (found) {
            found.permission = permission
            await found.save()
            return
        }
        await this.permissionsRepository.create({ userId, item, permission })
    }

    hasReadPermission(userId: ObjectId, item: ObjectId): Promise<boolean> {
        return this.hasPermission(userId, item, PermissionType.READ)
    }

    hasWritePermission(userId: ObjectId, item: ObjectId): Promise<boolean> {
        return this.hasPermission(userId, item, PermissionType.WRITE)
    }

    private async hasPermission(userId: ObjectId, item: ObjectId, permission: PermissionType): Promise<boolean> {
        const found = await this.permissionsRepository.findOne({ userId, item, permission })
        return !!found
    }
}
