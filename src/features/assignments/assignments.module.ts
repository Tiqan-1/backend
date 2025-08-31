import { forwardRef, Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentsController } from './assignments.controller'
import { AssignmentsRepository } from './assignments.repository'
import { AssignmentsService } from './assignments.service'
import { AssignmentResponsesModule } from '../assignment-responses/assignment-responses.module'
import { Assignment, AssignmentSchema } from './schemas/assignment.model'
import { MongooseModule } from '@nestjs/mongoose'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { ProgramsModule } from '../programs/programs.module'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
        SharedDocumentsModule,
        forwardRef(() => AssignmentResponsesModule),
        SubscriptionsModule,
        ProgramsModule,
    ],
    controllers: [AssignmentsController],
    providers: [AssignmentsService, AssignmentsRepository],
    exports: [AssignmentsService, AssignmentsRepository],
})
export class AssignmentsModule {}
