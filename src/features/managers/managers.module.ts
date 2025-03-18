import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from '../users/schemas/user.schema'
import { ManagersController } from './managers.controller'
import { ManagersRepository } from './managers.repository'
import { ManagersService } from './managers.service'
import { Manager, ManagerSchema } from './schemas/manager.schema'

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Manager.name, schema: ManagerSchema }] },
        ]),
    ],
    providers: [ManagersService, ManagersRepository],
    controllers: [ManagersController],
})
export class ManagersModule {}
