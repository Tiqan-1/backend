import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { ObjectId } from '../../../shared/repository/types'
import { User } from '../../users/schemas/user.schema'
import { PermissionType } from '../enums/permission.type.enum'

export type PermissionDocument = HydratedDocument<Permission>

@Schema()
export class Permission {
    @Prop({ required: true, type: ObjectId, ref: User.name })
    userId: ObjectId

    @Prop({ required: true, type: ObjectId })
    item: ObjectId

    @Prop({ required: true, type: String, enum: PermissionType })
    permission: PermissionType
}

export const PermissionSchema = SchemaFactory.createForClass(Permission)
