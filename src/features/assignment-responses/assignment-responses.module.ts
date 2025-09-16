import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentsModule } from '../assignments/assignments.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { AssignmentResponsesController } from './assignment-responses.controller'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { AssignmentResponsesService } from './assignment-responses.service'

@Module({
    imports: [AssignmentsModule, SharedDocumentsModule, SubscriptionsModule],
    controllers: [AssignmentResponsesController],
    providers: [AssignmentResponsesService, AssignmentResponsesRepository],
    exports: [AssignmentResponsesService, AssignmentResponsesRepository],
})
export class AssignmentResponsesModule {}
