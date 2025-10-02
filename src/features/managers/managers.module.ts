import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { EmailModule } from '../../shared/email/email.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { UsersModule } from '../users/users.module'
import { ManagersController } from './managers.controller'
import { ManagersRepository } from './managers.repository'
import { ManagersService } from './managers.service'

@Module({
    imports: [EmailModule, SharedDocumentsModule, SubjectsModule, ProgramsModule, UsersModule],
    controllers: [ManagersController],
    providers: [ManagersService, ManagersRepository],
    exports: [ManagersService],
})
export class ManagersModule {}
