import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationController } from '../src/features/authentication/authentication.controller'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { RefreshTokenRequestDto } from '../src/features/authentication/dto/refresh-token-request.dto'
import { ManagersLocalAuthGuard } from '../src/features/authentication/guards/managers-local-auth-guard.service'
import { ManagersLocalStrategy } from '../src/features/authentication/strategies/managers-local-strategy.service'
import { StudentsLocalStrategy } from '../src/features/authentication/strategies/students-local-strategy.service'
import { RefreshToken } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { User, UserDocument } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { Role } from '../src/shared/enums/role.enum'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const jwtService = {
    sign: jest.fn(),
}

describe('AuthenticationController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper
    let userModel: Model<User>
    let refreshTokenModel: Model<RefreshToken>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        userModel = mongoTestHelper.initUser()
        refreshTokenModel = mongoTestHelper.initRefreshToken()

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
                StudentsLocalStrategy,
                ManagersLocalStrategy,
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
        await mongoTestHelper.tearDown()
        await app.close()
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    it('POST /api/authentication/login with manager, should return 401', async () => {
        const user: User = {
            id: 'id',
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
            role: Role.Manager,
        }
        const model = new userModel(user)
        await model.save()

        const body = { email: 'testUser@gmail.com', password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/login').send(body).expect(HttpStatus.UNAUTHORIZED)
    })

    it('POST /api/authentication/login with student, should return 200', async () => {
        const user: User = {
            id: 'id',
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
            role: Role.Student,
        }
        const model = new userModel(user)
        await model.save()

        const body = { email: 'testUser@gmail.com', password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/login').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/manager-login with manager, should return 200', async () => {
        const user: User = {
            id: 'id',
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
            role: Role.Manager,
        }
        const model = new userModel(user)
        await model.save()

        const body = { email: 'testUser@gmail.com', password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/manager-login').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/logout with valid token, should return 200', async () => {
        const token: RefreshToken = {
            token: 'test token',
            user: { id: 'userId', name: 'test user' } as UserDocument,
            createdAt: new Date(),
        }
        const model = new refreshTokenModel(token)
        await model.save()

        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }
        return request(app.getHttpServer()).post('/api/authentication/logout').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/logout with invalid token, should return 401', async () => {
        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }

        return request(app.getHttpServer()).post('/api/authentication/logout').send(body).expect(HttpStatus.NOT_FOUND)
    })

    it('POST /api/authentication/refresh-tokens, should return 200', async () => {
        const token: RefreshToken = {
            token: 'test token',
            user: { id: 'userId', name: 'test user' } as UserDocument,
            createdAt: new Date(),
        }
        const model = new refreshTokenModel(token)
        await model.save()

        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }

        return request(app.getHttpServer()).post('/api/authentication/refresh-tokens').send(body).expect(HttpStatus.CREATED)
    })
})
