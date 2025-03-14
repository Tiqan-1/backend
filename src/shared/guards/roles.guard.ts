import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserDocument } from '../../features/users/schemas/user.schema'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { Role } from '../enums/role.enum'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()])
        if (!requiredRoles) {
            return true
        }
        const request = context.switchToHttp().getRequest<object & { user: UserDocument }>()
        return requiredRoles.some(role => request.user.role === role)
    }
}
