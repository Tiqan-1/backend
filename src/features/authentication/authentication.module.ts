import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { PassportModule } from '@nestjs/passport'
import { RefreshToken, RefreshTokenSchema } from '../tokens/schemas/refresh-token.schema'
import { TokensModule } from '../tokens/tokens.module'
import { UsersModule } from '../users/users.module'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { ManagersLocalStrategy } from './strategies/managers-local-strategy.service'
import { StudentsLocalStrategy } from './strategies/students-local-strategy.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
        UsersModule,
        TokensModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET as string,
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AuthenticationController],
    providers: [AuthenticationService, JwtStrategy, StudentsLocalStrategy, ManagersLocalStrategy],
    exports: [AuthenticationService],
})
export class AuthenticationModule {}
