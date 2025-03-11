import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthenticationModule } from './features/authentication/authentication.module'
import { ManagersModule } from './features/managers/managers.module'
import { TokensModule } from './features/tokens/tokens.module'
import { UsersModule } from './features/users/users.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI as string),
        UsersModule,
        AuthenticationModule,
        TokensModule,
        ManagersModule,
    ],
})
export class AppModule {}
