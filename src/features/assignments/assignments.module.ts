import { forwardRef, Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentResponsesModule } from '../assignment-responses/assignment-responses.module'
import { ProgramsModule } from '../programs/programs.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { TasksModule } from '../tasks/tasks.module'
import { AssignmentsController } from './assignments.controller'
import { AssignmentsRepository } from './assignments.repository'
import { AssignmentsService } from './assignments.service'

@Module({
    imports: [
        SharedDocumentsModule,
        forwardRef(() => AssignmentResponsesModule),
        SubscriptionsModule,
        ProgramsModule,
        TasksModule,
    ],
    controllers: [AssignmentsController],
    providers: [AssignmentsService, AssignmentsRepository],
    exports: [AssignmentsService, AssignmentsRepository],
})
export class AssignmentsModule {}
