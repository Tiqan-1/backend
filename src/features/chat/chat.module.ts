import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { ChatController } from './chat.controller'
import { ChatRepository } from './chat.repository'
import { ChatService } from './chat.service'
import { MessageRepository } from './message.repository'

@Module({
    imports: [SharedDocumentsModule],
    controllers: [ChatController],
    providers: [ChatService, ChatRepository, MessageRepository],
    exports: [ChatService],
})
export class ChatModule {}
