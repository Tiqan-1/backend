import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { StudentsController } from './students.controller'
import { StudentRepository } from './students.repository'
import { StudentsService } from './students.service'

@Module({
    imports: [AuthenticationModule, SharedDocumentsModule, SubscriptionsModule, ProgramsModule],
    providers: [StudentsService, StudentRepository],
    controllers: [StudentsController],
})
export class StudentsModule {}
