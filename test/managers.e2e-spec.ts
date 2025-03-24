import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { Subject } from 'rxjs'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { AuthenticationResponseDto } from '../src/features/authentication/dto/authentication-response.dto'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { SignUpManagerDto } from '../src/features/managers/dto/manager.dto'
import { ManagersController } from '../src/features/managers/managers.controller'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { Manager } from '../src/features/managers/schemas/manager.schema'
import { Program } from '../src/features/programs/schemas/program.schema'
import { RefreshToken } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { User } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { ConfigServiceProvider } from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const jwtService = {
    sign: jest.fn(),
}

describe('ManagersController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper
    let managerModel: Model<unknown>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        managerModel = mongoTestHelper.getManagerModel()

        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            controllers: [ManagersController],
            providers: [
                ManagersService,
                ManagersRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                JwtStrategy,
                ConfigServiceProvider,
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
                {
                    provide: getModelToken(Manager.name),
                    useValue: managerModel,
                },
                {
                    provide: getModelToken(Subject.name),
                    useValue: mongoTestHelper.getSubjectModel(),
                },
                {
                    provide: getModelToken(Program.name),
                    useValue: mongoTestHelper.getProgramModel(),
                },
                {
                    provide: getModelToken(User.name),
                    useValue: mongoTestHelper.getUserModel(),
                },
                {
                    provide: getModelToken(RefreshToken.name),
                    useValue: mongoTestHelper.getRefreshTokenModel(),
                },
            ],
        }).compile()

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

    it('POST /api/managers/sign-up', async () => {
        const user: SignUpManagerDto = { name: 'test user', email: 'testUser@gmail.com', password: 'testPassword' }
        const expectedResult = { name: 'test user', email: 'testUser@gmail.com' }

        const response = await request(app.getHttpServer()).post('/api/managers/sign-up').send(user).expect(HttpStatus.CREATED)
        expect(response).toBeDefined()
        const body = response.body as AuthenticationResponseDto
        expect(body.name).toEqual(expectedResult.name)
        expect(body.email).toEqual(expectedResult.email)
    })
})
