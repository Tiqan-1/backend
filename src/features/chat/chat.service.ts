import { Injectable, NotFoundException } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { PusherService } from 'nestjs-pusher'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { ObjectId } from '../../shared/repository/types'
import { ChatRepository } from './chat.repository'
import { ChatDto } from './dto/chat.dto'
import { MessageRequestDto } from './dto/message.dto'
import { MessageRepository } from './message.repository'

@Injectable()
export class ChatService {
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly messageRepository: MessageRepository,
        private readonly i18n: I18nService,
        private readonly pusherService: PusherService,
        private readonly documentsService: SharedDocumentsService
    ) {}

    async createChatRoom(createdBy: ObjectId): Promise<ObjectId> {
        const created = await this.chatRepository.create({ createdBy })
        return created._id
    }

    async joinChatRoom(chatRoomId: ObjectId): Promise<ChatDto> {
        const chatRoom = await this.chatRepository.findOne(chatRoomId)
        if (!chatRoom) {
            throw new NotFoundException(this.i18n.t('chat.errors.NOT_FOUND'))
        }
        return {
            id: chatRoom._id.toString(),
            createdAt: chatRoom.createdAt,
            createdBy: chatRoom.createdBy,
            messages: chatRoom.messages.map(message => ({
                id: message._id.toString(),
                createdAt: message.createdAt,
                sender: message.sender,
                text: message.text,
                updatedAt: message.updatedAt,
            })),
        }
    }

    async sendMessage(userId: ObjectId, chatRoomId: ObjectId, { message, socketId }: MessageRequestDto): Promise<void> {
        const chatRoom = await this.chatRepository.findOne(chatRoomId)
        if (!chatRoom) {
            throw new NotFoundException(this.i18n.t('chat.errors.NOT_FOUND'))
        }
        const messageId = await this.messageRepository.create({ sender: userId, text: message, chatRoomId: chatRoomId })
        chatRoom.messages.push(messageId)
        await chatRoom.save()

        const user = await this.documentsService.getUser(userId.toString())

        await this.pusherService.trigger(
            chatRoomId.toString(),
            'message',
            { message, sender: { email: user?.email, name: user?.name } },
            socketId
        )
    }
}
