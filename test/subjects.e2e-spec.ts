import { HttpStatus, INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { CreateSubjectDto } from '../src/features/subjects/dto/subject.dto'
import { Subject } from '../src/features/subjects/schemas/subject.schema'
import { SubjectsController } from '../src/features/subjects/subjects.controller'
import { SubjectsRepository } from '../src/features/subjects/subjects.repository'
import { SubjectsService } from '../src/features/subjects/subjects.service'
import { RefreshToken } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { User } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { Role } from '../src/shared/enums/role.enum'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const configService = { get: jest.fn().mockReturnValue('secret') }

describe('SubjectsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper
    let subjectModel: Model<Subject>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        subjectModel = mongoTestHelper.initSubject()
        const userModel = mongoTestHelper.initUser()
        const tokenModel = mongoTestHelper.initRefreshToken()

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'secret',
                    signOptions: { expiresIn: '1d' },
                }),
            ],
            controllers: [SubjectsController],
            providers: [
                SubjectsService,
                SubjectsRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                JwtService,
                JwtStrategy,
                { provide: ConfigService, useValue: configService },
                { provide: getModelToken(Subject.name), useValue: subjectModel },
                { provide: getModelToken(User.name), useValue: userModel },
                { provide: getModelToken(RefreshToken.name), useValue: tokenModel },
            ],
        }).compile()

        jwtService = module.get(JwtService)

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

    it('POST /api/subjects/', async () => {
        const token = jwtService.sign({ userId: 1, role: Role.Manager })
        const body: CreateSubjectDto = {
            name: 'subject name',
            description: 'description',
            lessonIds: ['1', '2'],
        }
        const response = await request(app.getHttpServer())
            .post('/api/subjects')
            .set('Authorization', `Bearer ${token}`)
            .send(body)
            .expect(HttpStatus.CREATED)
        expect(response.body).toBeDefined()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.id).toBeDefined()
    })
})
