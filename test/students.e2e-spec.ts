import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { AuthenticationResponseDto } from '../src/features/authentication/dto/authentication-response.dto'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { SignUpStudentDto } from '../src/features/students/dto/student.dto'
import { Gender } from '../src/features/students/enums/gender'
import { StudentDocument } from '../src/features/students/schemas/student.schema'
import { StudentsController } from '../src/features/students/students.controller'
import { StudentRepository } from '../src/features/students/students.repository'
import { StudentsService } from '../src/features/students/students.service'
import { CreateSubscriptionDto, StudentSubscriptionDto } from '../src/features/subscriptions/dto/subscription.dto'
import { State } from '../src/features/subscriptions/enums/state.enum'
import { SubscriptionDocument } from '../src/features/subscriptions/schemas/subscription.schema'
import { SubscriptionsRepository } from '../src/features/subscriptions/subscriptions.repository'
import { SubscriptionsService } from '../src/features/subscriptions/subscriptions.service'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('StudentsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [StudentsController],
            providers: [
                StudentsService,
                StudentRepository,
                SubscriptionsService,
                SubscriptionsRepository,
                ConfigServiceProvider,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                JwtStrategy,
                SharedDocumentsService,
                ...mongoTestHelper.providers,
            ],
        }).compile()

        jwtService = module.get(JwtService)
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

    describe('POST /api/students/sign-up', () => {
        it('should succeed', async () => {
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
            const response = await request(app.getHttpServer())
                .post('/api/students/sign-up')
                .send(user)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const body = response.body as AuthenticationResponseDto
            expect(body.name).toBe(expectedResult.name)
            expect(body.email).toBe(expectedResult.email)
        })
    })

    describe('POST /api/students/subscriptions/subscribe', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([], student._id)

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            const response = await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const { id } = response.body as CreatedDto

            const created = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(created).toBeTruthy()
            expect(id).toEqual(created._id.toString())
            expect(created.state).toEqual(State.active)
        })
    })

    describe('GET /api/students/subscriptions', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const level = await mongoTestHelper.createLevel([task._id])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id)
            const student = await mongoTestHelper.createStudent([subscription._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            const response = await request(app.getHttpServer())
                .get('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const {
                id,
                level: levelDto,
                program: programDto,
                state,
                subscriptionDate,
            } = (response.body as StudentSubscriptionDto[])[0]
            expect(id).toEqual(subscription._id.toString())
            expect(programDto?.id).toEqual(program._id.toString())
            expect(programDto?.levelIds).toEqual([level._id.toString()])
            expect(levelDto?.id).toEqual(level._id.toString())
            expect(levelDto?.tasks[0].id).toEqual(task._id.toString())
            expect(levelDto?.tasks[0].lessons[0].id).toEqual(lesson._id.toString())
            expect(state).toEqual(subscription.state)
            expect(subscriptionDate).toEqual(subscription.subscriptionDate.toISOString())
        })
    })

    describe('PUT /api/students/subscriptions/:id/suspend', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([], manager._id)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id)
            const student = await mongoTestHelper.createStudent([subscription._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .put(`/api/students/subscriptions/${subscription._id.toString()}/suspend`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const { state } = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(state).toEqual(State.suspended)
        })
    })

    describe('DELETE /api/students/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([], manager._id)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id)
            const student = await mongoTestHelper.createStudent([subscription._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/students/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const { state } = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(state).toEqual(State.deleted)

            const { subscriptions } = (await mongoTestHelper.getStudentModel().findOne()) as StudentDocument
            expect(subscriptions).toEqual([])
        })
    })
})
