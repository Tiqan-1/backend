import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationController } from '../src/features/authentication/authentication.controller'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { LocalStrategy } from '../src/features/authentication/strategies/local.strategy'
import { RefreshToken, RefreshTokenSchema } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { CreateUserDto } from '../src/features/users/dto/create-user.dto'
import { User, UserSchema } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { LocalAuthGuard } from '../src/shared/guards/local-auth.guard'

const jwtService = {
    sign: jest.fn(),
}

describe('AuthenticationController (e2e)', () => {
    let app: INestApplication<App>
    let mongoServer: MongoMemoryServer
    let mongoConnection: Connection
    let userModel: Model<User>
    let refreshTokenModel: Model<RefreshToken>

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
        const uri = mongoServer.getUri()
        mongoConnection = (await connect(uri)).connection
        userModel = mongoConnection.model(User.name, UserSchema)
        refreshTokenModel = mongoConnection.model(RefreshToken.name, RefreshTokenSchema)

        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            controllers: [AuthenticationController],
            providers: [
                AuthenticationService,
                JwtService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                LocalStrategy,
                LocalAuthGuard,
                {
                    provide: getModelToken(User.name),
                    useValue: userModel,
                },
                {
                    provide: getModelToken(RefreshToken.name),
                    useValue: refreshTokenModel,
                },
            ],
        })
            .overrideProvider(JwtService)
            .useValue(jwtService)
            .compile()

        app = module.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await mongoConnection.dropDatabase()
        await mongoConnection.close()
        await mongoServer.stop()
        await app.close()
    })

    afterEach(async () => {
        const collections = mongoConnection.collections
        for (const key in collections) {
            const collection = collections[key]
            await collection.deleteMany({})
        }
    })

    it('POST /authentication/sign-up', () => {
        const user: CreateUserDto = { name: 'test user', email: 'testUser@gmail.com', password: 'testPassword' }
        const expectedResult = { name: 'test user', email: 'testUser@gmail.com' }
        return request(app.getHttpServer())
            .post('/authentication/sign-up')
            .send(user)
            .expect(HttpStatus.CREATED)
            .expect(expectedResult)
    })

    it('POST /authentication/login', async () => {
        const user: User = { name: 'test user', email: 'testUser@gmail.com', password: bcrypt.hashSync('testPassword', 10) }
        const model = new userModel(user)
        await model.save()

        const body = { email: 'testUser@gmail.com', password: 'testPassword' }
        return request(app.getHttpServer()).post('/authentication/login').send(body).expect(HttpStatus.OK)
    })
})
