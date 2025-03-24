import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { AuthenticationResponseDto } from '../src/features/authentication/dto/authentication-response.dto'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { SignUpStudentDto } from '../src/features/students/dto/student.dto'
import { Gender } from '../src/features/students/enums/gender'
import { Student } from '../src/features/students/schemas/student.schema'
import { StudentsController } from '../src/features/students/students.controller'
import { StudentRepository } from '../src/features/students/students.repository'
import { StudentsService } from '../src/features/students/students.service'
import { RefreshToken } from '../src/features/tokens/schemas/refresh-token.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { User } from '../src/features/users/schemas/user.schema'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { ConfigServiceProvider, mockJwtStrategyValidation } from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const jwtService = {
    sign: jest.fn(),
}

describe('StudentsController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper
    let studentModel: Model<Student>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        studentModel = mongoTestHelper.getStudentModel()

        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            controllers: [StudentsController],
            providers: [
                StudentsService,
                StudentRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                JwtStrategy,
                ConfigServiceProvider,
                { provide: JwtService, useValue: jwtService },
                { provide: getModelToken(Student.name), useValue: studentModel },
                { provide: getModelToken(User.name), useValue: mongoTestHelper.getUserModel() },
                { provide: getModelToken(RefreshToken.name), useValue: mongoTestHelper.getRefreshTokenModel() },
            ],
        }).compile()

        mockJwtStrategyValidation(module)

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

    it('POST /api/students/sign-up', async () => {
        const user: SignUpStudentDto = {
            name: 'test user',
            email: 'testUser@gmail.com',
            gender: Gender.male,
            password: 'testPassword',
        }
        const expectedResult: AuthenticationResponseDto = {
            name: 'test user',
            email: 'testUser@gmail.com',
            accessToken: 'any',
            refreshToken: 'any',
        }
        const response = await request(app.getHttpServer()).post('/api/students/sign-up').send(user).expect(HttpStatus.CREATED)

        expect(response.body).toBeDefined()
        const body = response.body as AuthenticationResponseDto
        expect(body.name).toBe(expectedResult.name)
        expect(body.email).toBe(expectedResult.email)
    })
})
