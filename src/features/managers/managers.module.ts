import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { ManagersController } from './managers.controller'
import { ManagersRepository } from './managers.repository'
import { ManagersService } from './managers.service'

@Module({
    imports: [AuthenticationModule, SharedDocumentsModule, SubjectsModule, ProgramsModule],
    controllers: [ManagersController],
    providers: [ManagersService, ManagersRepository],
    exports: [ManagersService],
})
export class ManagersModule {}
