import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { SubscriptionsController } from './subscriptions.controller'
import { SubscriptionsRepository } from './subscriptions.repository'
import { SubscriptionsService } from './subscriptions.service'

@Module({
    imports: [SharedDocumentsModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, SubscriptionsRepository],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
