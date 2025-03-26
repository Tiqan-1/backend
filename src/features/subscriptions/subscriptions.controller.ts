import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Roles } from '../authentication/decorators/roles.decorator'
import { Role } from '../authentication/enums/role.enum'
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard'
import { RolesGuard } from '../authentication/guards/roles.guard'
import { SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto'
import { SubscriptionsService } from './subscriptions.service'

@Roles(Role.Manager)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('api/subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @ApiOperation({ summary: 'Finds all subscriptions.', description: 'Finds all subscriptions.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubscriptionDto, isArray: true, description: 'Got subscriptions successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @HttpCode(HttpStatus.OK)
    @Get()
    findAll(): Promise<SubscriptionDto[]> {
        return this.subscriptionsService.findAll()
    }

    @ApiOperation({ summary: 'Finds subscription by id', description: 'Finds subscription by id.' })
    @ApiResponse({ status: HttpStatus.OK, type: SubscriptionDto, description: 'Got subscription successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'subscription not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user.' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @HttpCode(HttpStatus.OK)
    @Get(':id')
    findOne(@Param('id') id: string): Promise<SubscriptionDto> {
        return this.subscriptionsService.findOne(id)
    }

    @ApiOperation({ summary: 'Updates a subscription', description: 'Updates a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully updated.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Request validation failed.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto): Promise<void> {
        return this.subscriptionsService.update(id, updateSubscriptionDto)
    }

    @ApiOperation({ summary: 'Deletes a subscription', description: 'Deletes a subscription.' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Subscription successfully deleted.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'An internal server error occurred.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Subscription not found.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized user' })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User is forbidden to call this function.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.subscriptionsService.remove(id)
    }
}
