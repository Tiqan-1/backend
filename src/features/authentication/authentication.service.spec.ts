import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { TokensModule } from '../tokens/tokens.module'
import { UsersModule } from '../users/users.module'
import { AuthenticationService } from './authentication.service'

const jwtService = {
    sign: () => {},
}

describe('AuthenticationService', () => {
    let service: AuthenticationService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                UsersModule,
                TokensModule,
                ConfigModule,
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
                MongooseModule.forRoot(process.env.MONGODB_URI as string),
            ],
            providers: [AuthenticationService, JwtService],
        })
            .overrideProvider(JwtService)
            .useValue(jwtService)
            .compile()

        service = module.get<AuthenticationService>(AuthenticationService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
