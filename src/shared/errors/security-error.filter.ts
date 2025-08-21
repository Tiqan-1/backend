import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    HttpStatus,
    Logger,
    UnauthorizedException,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { TokenUser } from '../../features/authentication/types/token-user'

type Request = FastifyRequest & { user: TokenUser }

@Catch(UnauthorizedException, ForbiddenException)
export class SecurityErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(SecurityErrorFilter.name)

    catch(error: UnauthorizedException | ForbiddenException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const request = ctx.getRequest<Request>()
        const response = ctx.getResponse<FastifyReply>()
        const user = request.user
        if (error.name === UnauthorizedException.name) {
            this.logger.error(`Unauthorized user ${user?.id?.toString()} accessing ${request.url}.`, { origin: error })
            response
                .status(HttpStatus.UNAUTHORIZED)
                .send({ message: 'Unauthorized', error: 'Unauthorized', statusCode: HttpStatus.UNAUTHORIZED })
            return
        }
        if (error.name === ForbiddenException.name) {
            this.logger.error(`Forbidden user ${user.id.toString()} accessing ${request.url}.`, { origin: error })
            response
                .status(HttpStatus.FORBIDDEN)
                .send({ message: 'Forbidden', error: 'Forbidden', statusCode: HttpStatus.FORBIDDEN })
            return
        }
        throw error
    }
}
