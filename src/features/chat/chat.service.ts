import { Injectable, Logger, NotFoundException } from '@nestjs/common'
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
    private readonly logger = new Logger(ChatService.name)

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
        this.logger.log(`Joining chat room ${chatRoomId.toString()}`)
        const chatRoom = await this.chatRepository.findOne(chatRoomId)
        if (!chatRoom) {
            throw new NotFoundException(this.i18n.t('chat.errors.NOT_FOUND'))
        }
        console.debug('chatRoom: ', JSON.stringify(chatRoom.messages))
        return {
            id: chatRoom._id.toString(),
            createdAt: chatRoom.createdAt,
            createdBy: { name: chatRoom.createdBy.name, email: chatRoom.createdBy.name },
            messages: chatRoom.messages.map(message => ({
                id: message._id.toString(),
                createdAt: message.createdAt,
                sender: { name: message.sender.name, email: message.sender.name },
                text: message.text,
                updatedAt: message.updatedAt,
            })),
        }
    }

    async sendMessage(userId: ObjectId, chatRoomId: ObjectId, { message, socketId }: MessageRequestDto): Promise<void> {
        this.logger.debug(
            `Sending message to chat room ${chatRoomId.toString()} from user ${userId.toString()}: ${message}, socketId: ${socketId}`
        )
        const chatRoom = await this.chatRepository.findOneRaw(chatRoomId)
        if (!chatRoom) {
            throw new NotFoundException(this.i18n.t('chat.errors.NOT_FOUND'))
        }
        const messageId = await this.messageRepository.create({ sender: userId, text: message, chatRoomId: chatRoomId })
        await chatRoom.updateOne({ messages: [...chatRoom.messages.map(message => message._id), messageId._id] })

        const user = await this.documentsService.getUser(userId.toString())

        await this.pusherService.trigger(
            chatRoomId.toString(),
            'message',
            { message, sender: { email: user?.email, name: user?.name } },
            socketId
        )
    }

    async removeChatRoom(chatRoomId: ObjectId): Promise<void> {
        this.logger.log(`Removing chat room ${chatRoomId.toString()}`)
        await this.chatRepository.remove({ _id: chatRoomId })
    }
}
