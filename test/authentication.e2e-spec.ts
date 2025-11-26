import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { I18nService } from 'nestjs-i18n'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, it, vi } from 'vitest'
import { AuthenticationController } from '../src/features/authentication/authentication.controller'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { RefreshTokenRequestDto } from '../src/features/authentication/dto/refresh-token-request.dto'
import { ManagersLocalStrategy } from '../src/features/authentication/strategies/managers-local-strategy.service'
import { StudentsLocalStrategy } from '../src/features/authentication/strategies/students-local-strategy.service'
import { VerificationCodesRepository } from '../src/features/authentication/verification-codes.repository'
import { RefreshToken } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { UserDocument } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import {
    ConfigServiceProvider,
    EmailServiceProvider,
    JwtMockModule,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const jwtService = {
    sign: vi.fn(),
}

describe('AuthenticationController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        try {
            const module: TestingModule = await Test.createTestingModule({
                imports: [JwtMockModule],
                controllers: [AuthenticationController],
                providers: [
                    { provide: I18nService, useValue: { t: vi.fn() } },
                    AuthenticationService,
                    SharedDocumentsService,
                    JwtService,
                    UsersService,
                    UsersRepository,
                    TokensService,
                    TokensRepository,
                    StudentsLocalStrategy,
                    ManagersLocalStrategy,
                    VerificationCodesRepository,
                    { provide: JwtService, useValue: jwtService },
                    ConfigServiceProvider,
                    EmailServiceProvider,
                    ...mongoTestHelper.providers,
                ],
            }).compile()

            app = module.createNestApplication()
            await app.init()
        } catch (error) {
            console.log(error)
        }
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
        await app.close()
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    it('POST /api/authentication/login with manager, should return 401', async () => {
        const manager = await mongoTestHelper.createManager()

        const body = { email: manager.email, password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/login').send(body).expect(HttpStatus.UNAUTHORIZED)
    })

    it('POST /api/authentication/login with student, should return 200', async () => {
        const student = await mongoTestHelper.createStudent()

        const body = { email: student.email, password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/login').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/manager-login with manager, should return 200', async () => {
        const manager = await mongoTestHelper.createManager()

        const body = { email: manager.email, password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/manager-login').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/manager-login with student, should return 409', async () => {
        const student = await mongoTestHelper.createStudent()

        const body = { email: student.email, password: 'testPassword' }
        return request(app.getHttpServer()).post('/api/authentication/manager-login').send(body).expect(HttpStatus.CONFLICT)
    })

    it('POST /api/authentication/logout with valid token, should return 200', async () => {
        const token: RefreshToken = {
            token: 'test token',
            user: { id: 'userId', name: 'test user' } as UserDocument,
            createdAt: new Date(),
        }
        const refreshTokenModel = mongoTestHelper.getRefreshTokenModel()
        const model = new refreshTokenModel(token)
        await model.save()

        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }
        return request(app.getHttpServer()).post('/api/authentication/logout').send(body).expect(HttpStatus.OK)
    })

    it('POST /api/authentication/logout with invalid token, should return 404', async () => {
        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }

        return request(app.getHttpServer()).post('/api/authentication/logout').send(body).expect(HttpStatus.NOT_FOUND)
    })

    it('POST /api/authentication/refresh-tokens, should return 200', async () => {
        const user = await mongoTestHelper.createUser()
        const refreshToken = await mongoTestHelper.createToken(user)

        const body: RefreshTokenRequestDto = { refreshToken }

        return request(app.getHttpServer()).post('/api/authentication/refresh-tokens').send(body).expect(HttpStatus.CREATED)
    })

    it('POST /api/authentication/refresh-tokens with invalid token, should return 401', async () => {
        const body: RefreshTokenRequestDto = { refreshToken: 'test token' }

        return request(app.getHttpServer()).post('/api/authentication/refresh-tokens').send(body).expect(HttpStatus.UNAUTHORIZED)
    })
})
