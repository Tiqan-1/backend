import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class ManagersLocalAuthGuard extends AuthGuard('managers-local-strategy') {}
