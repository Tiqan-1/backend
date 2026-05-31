import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { Connection } from 'mongoose'

@ApiTags('health')
@SkipThrottle()
@Controller('api/health')
export class HealthController {
    constructor(@InjectConnection() private readonly connection: Connection) {}

    @ApiOperation({
        summary: 'Service health probe',
        description: 'Returns 200 when the API is up and MongoDB is connected, 503 otherwise. Intended for uptime monitoring (UptimeRobot).',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Service is healthy.' })
    @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE, description: 'A dependency (MongoDB) is unavailable.' })
    @Get()
    check(): { status: string; uptime: number; timestamp: string; db: string } {
        const dbConnected = this.connection.readyState === 1
        const body = {
            status: dbConnected ? 'ok' : 'degraded',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            db: dbConnected ? 'up' : 'down',
        }
        if (!dbConnected) {
            throw new ServiceUnavailableException(body)
        }
        return body
    }
}
