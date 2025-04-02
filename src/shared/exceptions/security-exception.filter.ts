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
export class SecurityExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SecurityExceptionFilter.name)

    catch(exception: UnauthorizedException | ForbiddenException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const request = ctx.getRequest<Request>()
        const response = ctx.getResponse<FastifyReply>()
        const user = request.user
        if (exception.name === UnauthorizedException.name) {
            this.logger.error(`Unauthorized user ${user?.id?.toString()} accessing ${request.url}.`, { origin: exception })
            response
                .status(HttpStatus.UNAUTHORIZED)
                .send({ message: 'Unauthorized', error: 'Unauthorized', statusCode: HttpStatus.UNAUTHORIZED })
            return
        }
        if (exception.name === ForbiddenException.name) {
            this.logger.error(`Forbidden user ${user.id.toString()} accessing ${request.url}.`, { origin: exception })
            response
                .status(HttpStatus.FORBIDDEN)
                .send({ message: 'Forbidden', error: 'Forbidden', statusCode: HttpStatus.FORBIDDEN })
            return
        }
        throw exception
    }
}
