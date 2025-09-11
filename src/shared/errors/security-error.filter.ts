import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    HttpStatus,
    Logger,
    UnauthorizedException,
} from '@nestjs/common'
import { Request as ExpressRequest, Response } from 'express'
import { I18nService } from 'nestjs-i18n'
import { TokenUser } from '../../features/authentication/types/token-user'

type Request = ExpressRequest & { user: TokenUser }

@Catch(UnauthorizedException, ForbiddenException)
export class SecurityErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(SecurityErrorFilter.name)
    constructor(private readonly i18n: I18nService) {}

    catch(error: UnauthorizedException | ForbiddenException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const request = ctx.getRequest<Request>()
        const response = ctx.getResponse<Response>()
        const user = request.user
        if (error.name === UnauthorizedException.name) {
            this.logger.error(`Unauthorized user ${user?.id?.toString()} accessing ${request.url}.`, { origin: error })
            response
                .status(HttpStatus.UNAUTHORIZED)
                .contentType('application/json')
                .json({ message: this.i18n.t('errors.unauthorized'), error: 'Unauthorized', statusCode: HttpStatus.UNAUTHORIZED })
            return
        }
        if (error.name === ForbiddenException.name) {
            this.logger.error(`Forbidden user ${user.id.toString()} accessing ${request.url}.`, { origin: error })
            response
                .status(HttpStatus.FORBIDDEN)
                .contentType('application/json')
                .json({ message: this.i18n.t('errors.forbidden'), error: 'Forbidden', statusCode: HttpStatus.FORBIDDEN })
            return
        }
        throw error
    }
}
