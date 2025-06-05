import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { JwtModuleOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface'
import { PassportModule } from '@nestjs/passport'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { TokensModule } from '../tokens/tokens.module'
import { UsersModule } from '../users/users.module'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RolesGuard } from './guards/roles.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { ManagersLocalStrategy } from './strategies/managers-local-strategy.service'
import { StudentsLocalStrategy } from './strategies/students-local-strategy.service'

async function getJwtModuleOptions(): Promise<JwtModuleOptions> {
    await ConfigModule.envVariablesLoaded
    return {
        secret: process.env.JWT_SECRET as string,
        signOptions: { expiresIn: '1d' },
    }
}

@Module({
    imports: [
        SharedDocumentsModule,
        UsersModule,
        TokensModule,
        PassportModule,
        JwtModule.registerAsync({ useFactory: () => getJwtModuleOptions() }),
    ],
    controllers: [AuthenticationController],
    providers: [AuthenticationService, JwtStrategy, StudentsLocalStrategy, ManagersLocalStrategy, JwtAuthGuard, RolesGuard],
    exports: [AuthenticationService, JwtAuthGuard, RolesGuard],
})
export class AuthenticationModule {}
