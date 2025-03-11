import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class StudentsLocalAuthGuard extends AuthGuard('students-local-strategy') {}
