import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { Error } from 'mongoose'

@Catch(Error)
export class MongoDbExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(MongoDbExceptionFilter.name)

    catch(exception: Error, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<FastifyReply>()

        // Handle BSON errors
        if (exception.name === 'BSONError') {
            this.logger.error(`BSONError caught in global filter: ${exception.message}`)
            response.status(400).send({ message: 'Id validation error.' })
            return
        }

        // Handle Mongoose validation errors
        if (exception.name === 'ValidationError') {
            this.logger.error(`Mongoose ValidationError caught: ${exception.message}`)
            response.status(500).send({ message: 'Database validation error.' })
            return
        }

        // Handle other Mongoose-specific errors
        if (exception.name === 'CastError') {
            this.logger.error(`Mongoose CastError caught: ${exception.message}`)
            response.status(500).send({ message: 'Invalid type or format for provided data.' })
            return
        }

        // Re-throw other errors to let them be handled by other filters or default behavior
        throw exception
    }
}
