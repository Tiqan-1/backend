import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../users/users.module'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { LocalStrategy } from './local.strategy'

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET as string,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AuthenticationController],
    providers: [AuthenticationService, LocalStrategy],
    exports: [AuthenticationService],
})
export class AuthenticationModule {}
