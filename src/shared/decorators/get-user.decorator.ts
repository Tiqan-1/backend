import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { TokenUser } from '../../features/authentication/types/token-user'

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): TokenUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: TokenUser }>()
    return request.user
})
