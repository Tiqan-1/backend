import { Body, Controller, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common'
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
} from '@nestjs/swagger'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ParseMongoIdPipe } from '../../shared/pipes/ParseMongoIdPipe'
import { ObjectId } from '../../shared/repository/types'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { TokenUser } from '../authentication/types/token-user'
import { ChatService } from './chat.service'
import { ChatDto } from './dto/chat.dto'
import { CreateMessageDto } from './dto/message.dto'

@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @ApiOperation({ description: 'Joins a chat room.', summary: 'Joins a chat room.' })
    @ApiOkResponse({ type: ChatDto, description: 'Chat room successfully joined.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.', type: ErrorDto })
    @ApiNotFoundResponse({ description: 'Chat room not found.', type: ErrorDto })
    @ApiBadRequestResponse({ description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'chatRoomId', type: String, required: true })
    @Post(':chatRoomId/join')
    async joinChatRoom(@Param('chatRoomId', ParseMongoIdPipe) chatRoomId: ObjectId): Promise<ChatDto> {
        return this.chatService.joinChatRoom(chatRoomId)
    }

    @ApiOperation({ description: 'Sends a message in a chat room.', summary: 'Sends a message in a chat room.' })
    @ApiNoContentResponse({ description: 'Message successfully sent.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.', type: ErrorDto })
    @ApiNotFoundResponse({ description: 'Chat room not found.', type: ErrorDto })
    @ApiBadRequestResponse({ description: 'Request validation failed.', type: BadRequestErrorDto })
    @ApiBody({ required: true, type: CreateMessageDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'chatRoomId', type: String, required: true })
    @Post(':chatRoomId/send-message')
    async sendMessage(
        @Param('chatRoomId', ParseMongoIdPipe) chatRoomId: ObjectId,
        @Request() req: { user: TokenUser },
        @Body('message') message: string
    ): Promise<void> {
        return this.chatService.sendMessage(req.user.id, chatRoomId, message)
    }
}
