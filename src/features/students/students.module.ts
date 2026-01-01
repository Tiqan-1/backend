import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { EmailModule } from '../../shared/email/email.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { UsersModule } from '../users/users.module'
import { StudentsController } from './students.controller'
import { StudentRepository } from './students.repository'
import { StudentsService } from './students.service'

@Module({
    imports: [AuthenticationModule, SharedDocumentsModule, SubscriptionsModule, ProgramsModule, EmailModule, UsersModule],
    providers: [StudentsService, StudentRepository],
    controllers: [StudentsController],
})
export class StudentsModule {}
