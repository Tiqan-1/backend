import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { LessonsModule } from '../lessons/lessons.module'
import { SubjectsController } from './subjects.controller'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

@Module({
    imports: [AuthenticationModule, SharedDocumentsModule, LessonsModule],
    controllers: [SubjectsController],
    providers: [SubjectsService, SubjectsRepository],
    exports: [SubjectsService],
})
export class SubjectsModule {}
