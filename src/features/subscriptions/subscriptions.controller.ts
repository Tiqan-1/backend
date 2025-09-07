import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { I18nService } from 'nestjs-i18n'
import { BadRequestErrorDto } from '../../shared/dto/bad-request-error.dto'
import { ErrorDto } from '../../shared/dto/error.dto'
import { ObjectId } from '../../shared/repository/types'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { TokenUser } from '../authentication/types/token-user'
import { PaginatedSubscriptionDto } from './dto/paginated-subscripition.dto'
import { SearchSubscriptionsQueryDto } from './dto/search-subscriptions-query.dto'
import { UpdateSubscriptionDto } from './dto/subscription.dto'
import { SubscriptionState } from './enums/subscription-state.enum'
import { SubscriptionsService } from './subscriptions.service'

@Roles(Role.Manager)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('api/subscriptions')
export class SubscriptionsController {
    constructor(
        private readonly subscriptionsService: SubscriptionsService,
        private readonly i18n: I18nService
    ) {}

    @ApiOperation({ summary: 'Finds subscriptions.', description: 'Finds subscriptions.' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedSubscriptionDto, description: 'Got subscriptions successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request is not valid.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.OK)
    @Get('v2')
    find(@Query() query: SearchSubscriptionsQueryDto, @Request() req: { user: TokenUser }): Promise<PaginatedSubscriptionDto> {
        return this.subscriptionsService.find(query, req.user.id)
    }

    @ApiOperation({ summary: 'Approves subscriptions.', description: 'Sets subscription to active state.' })
    @ApiResponse({ status: HttpStatus.OK, type: PaginatedSubscriptionDto, description: 'Subscriptions approved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this endpoint.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.', type: ErrorDto })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Subscription not in pending state and therefore cannot be approved.',
        type: ErrorDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_ACCEPTABLE,
        description: 'Current user is not the owner of the subscription.',
        type: ErrorDto,
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put(':id/approve')
    approve(@Param('id') id: ObjectId, @Request() req: { user: TokenUser }): Promise<void> {
        return this.subscriptionsService.approve(id, req.user.id)
    }

    @ApiOperation({ summary: 'Updates a subscription', description: 'Updates a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.', type: BadRequestErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto): Promise<void> {
        if (updateSubscriptionDto.state && updateSubscriptionDto.state === SubscriptionState.deleted) {
            throw new BadRequestException(this.i18n.t('subscriptions.errors.cannotUpdateStateToDeleted'))
        }
        return this.subscriptionsService.update(id, updateSubscriptionDto)
    }

    @ApiOperation({ summary: 'Deletes a subscription', description: 'Deletes a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user', type: ErrorDto })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.', type: ErrorDto })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.subscriptionsService.remove(id)
    }
}
