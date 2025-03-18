import { HttpStatus, INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { CreateSubjectDto, SubjectDto } from '../src/features/subjects/dto/subject.dto'
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
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const configService = { get: jest.fn().mockReturnValue('secret') }

describe('SubjectsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper
    let subjectModel: Model<Subject>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        subjectModel = mongoTestHelper.getSubjectModel()
        mongoTestHelper.getLessonModel()
        const userModel = mongoTestHelper.getUserModel()
        const tokenModel = mongoTestHelper.getRefreshTokenModel()

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

    describe('POST /api/subjects/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })
            const body: CreateSubjectDto = {
                name: 'subject name',
                description: 'description',
                lessonIds: [lesson._id.toString()],
            }

            const expected = {
                name: body.name,
                description: body.description,
                createdBy: {
                    name: manager.name,
                    email: manager.email,
                },
                lessons: [
                    {
                        id: lesson._id.toString(),
                        title: lesson.title,
                        type: lesson.type,
                        url: lesson.url,
                    },
                ],
            }

            const response = await request(app.getHttpServer())
                .post('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)
            expect(response.body).toBeDefined()
            const { id, ...params } = response.body as SubjectDto
            expect(id).toBeDefined()
            expect(params).toEqual(expected)
        })

        it('called with a student, should throw 401', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            const body: CreateSubjectDto = {
                name: 'subject name',
                description: 'description',
                lessonIds: ['1', '2'],
            }
            await request(app.getHttpServer())
                .post('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/subjects/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })
            const subject1 = await mongoTestHelper.createSubject(manager, [])
            const subject2 = await mongoTestHelper.createSubject(manager, [])

            const response = await request(app.getHttpServer())
                .get('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const responseBody = response.body as SubjectDto[]
            expect(responseBody.length).toEqual(2)
            const ids = responseBody.map(s => s.id)
            expect(ids).toContain(subject1._id.toString())
            expect(ids).toContain(subject2._id.toString())
        })

        it('called with a student, should throw 401', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            await request(app.getHttpServer())
                .get('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/subjects/user/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })
            const subject1 = await mongoTestHelper.createSubject(manager, [])
            const subject2 = await mongoTestHelper.createSubject(manager, [])

            const response = await request(app.getHttpServer())
                .get('/api/subjects/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const responseBody = response.body as SubjectDto[]
            expect(responseBody.length).toEqual(2)
            const ids = responseBody.map(s => s.id)
            expect(ids).toContain(subject1._id.toString())
            expect(ids).toContain(subject2._id.toString())
        })

        it('should only return subjects of user', async () => {
            const manager1 = await mongoTestHelper.createManager('1')
            const token = jwtService.sign({ id: manager1._id, role: Role.Manager })
            const subject1 = await mongoTestHelper.createSubject(manager1, [])

            const manager2 = await mongoTestHelper.createManager('2')
            await mongoTestHelper.createSubject(manager2, [])

            const response = await request(app.getHttpServer())
                .get('/api/subjects/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const responseBody = response.body as SubjectDto[]
            expect(responseBody.length).toEqual(1)
            const ids = responseBody.map(s => s.id)
            expect(ids).toContain(subject1._id.toString())
        })

        it('called with a student, should throw 401', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            await request(app.getHttpServer())
                .get('/api/subjects/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
