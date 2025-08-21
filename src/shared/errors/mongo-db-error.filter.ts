import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { Error } from 'mongoose'

@Catch()
export class MongoDbErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(MongoDbErrorFilter.name)

    catch(error: Error, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<FastifyReply>()

        // Handle BSON errors
        if (error.name === 'BSONError') {
            this.logger.error(`BSONError caught: ${error.message}`, error.stack)
            response.status(HttpStatus.BAD_REQUEST).send({ message: 'Id validation error.', statusCode: HttpStatus.BAD_REQUEST })
            return
        }

        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            this.logger.error(`Mongoose ValidationError caught: ${error.message}`)
            response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send({ message: 'Database validation error.', statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
            return
        }

        // Handle other Mongoose-specific errors
        if (error.name === 'CastError') {
            this.logger.error(`Mongoose CastError caught: ${error.message}`)
            response
                .status(HttpStatus.BAD_REQUEST)
                .send({ message: 'Invalid type or format for provided data.', statusCode: HttpStatus.INTERNAL_SERVER_ERROR })
            return
        }

        // Re-throw other errors to let them be handled by other filters or default behavior
        throw error
    }
}
