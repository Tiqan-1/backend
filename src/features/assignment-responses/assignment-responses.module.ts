import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentsModule } from '../assignments/assignments.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { AssignmentResponsesHandlerService } from './assignment-responses-handler.service'
import { AssignmentResponsesController } from './assignment-responses.controller'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { AssignmentResponsesService } from './assignment-responses.service'

@Module({
    imports: [AssignmentsModule, SharedDocumentsModule, SubscriptionsModule, ProgramsModule],
    controllers: [AssignmentResponsesController],
    providers: [AssignmentResponsesHandlerService, AssignmentResponsesService, AssignmentResponsesRepository],
    exports: [AssignmentResponsesService, AssignmentResponsesRepository],
})
export class AssignmentResponsesModule {}
