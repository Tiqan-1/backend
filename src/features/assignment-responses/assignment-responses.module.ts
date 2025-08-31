import { forwardRef, Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentResponsesController } from './assignment-responses.controller'
import { AssignmentResponsesRepository } from './assignment-responses.repository'
import { AssignmentResponsesService } from './assignment-responses.service'
import { ProgramsModule } from '../programs/programs.module'
import { AssignmentsModule } from '../assignments/assignments.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { AssignmentResponsesHandlerService } from './assignment-responses-handler.service'
import { MongooseModule } from '@nestjs/mongoose'
import { AssignmentResponse, AssignmentResponseSchema } from './schemas/assignment-response.schema'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AssignmentResponse.name, schema: AssignmentResponseSchema }]),
        forwardRef(() => AssignmentsModule),
        SharedDocumentsModule, 
        SubscriptionsModule,
        ProgramsModule,
    ],
    controllers: [AssignmentResponsesController],
    providers: [AssignmentResponsesHandlerService, AssignmentResponsesService, AssignmentResponsesRepository],
    exports: [AssignmentResponsesService, AssignmentResponsesRepository],
})
export class AssignmentResponsesModule {}
