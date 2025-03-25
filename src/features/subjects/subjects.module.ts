import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { ManagersModule } from '../managers/managers.module'
import { SubjectsController } from './subjects.controller'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

@Module({
    imports: [AuthenticationModule, ManagersModule, SharedDocumentsModule],
    controllers: [SubjectsController],
    providers: [SubjectsService, SubjectsRepository],
    exports: [SubjectsService],
})
export class SubjectsModule {}
