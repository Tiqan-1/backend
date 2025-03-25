import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { ManagersController } from './managers.controller'
import { ManagersRepository } from './managers.repository'
import { ManagersService } from './managers.service'

@Module({
    imports: [AuthenticationModule, SharedDocumentsModule],
    controllers: [ManagersController],
    providers: [ManagersService, ManagersRepository],
    exports: [ManagersService],
})
export class ManagersModule {}
