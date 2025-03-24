import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { Lesson } from '../src/features/lessons/schemas/lesson.schema'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { Manager } from '../src/features/managers/schemas/manager.schema'
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
import { CreatedDto } from '../src/shared/dto/created.dto'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('SubjectsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [SubjectsController],
            providers: [
                SubjectsService,
                SubjectsRepository,
                LessonsService,
                LessonsRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                ManagersService,
                ManagersRepository,
                JwtService,
                JwtStrategy,
                ConfigServiceProvider,
                { provide: getModelToken(Subject.name), useValue: mongoTestHelper.getSubjectModel() },
                { provide: getModelToken(Lesson.name), useValue: mongoTestHelper.getLessonModel() },
                { provide: getModelToken(Manager.name), useValue: mongoTestHelper.getManagerModel() },
                { provide: getModelToken(User.name), useValue: mongoTestHelper.getUserModel() },
                { provide: getModelToken(RefreshToken.name), useValue: mongoTestHelper.getRefreshTokenModel() },
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

    describe('POST /api/subjects/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const body: CreateSubjectDto = {
                name: 'subject name',
                description: 'description',
                lessonIds: [lesson._id.toString()],
            }

            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const response = await request(app.getHttpServer())
                .post('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)
            expect(response.body).toBeDefined()
            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()
        })

        it('called with a student, should throw 403', async () => {
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
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
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

        it('called with a student, should throw 403', async () => {
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
            const token = jwtService.sign({ id: manager._id, role: manager.role })
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

        it('called with a student, should throw 403', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            await request(app.getHttpServer())
                .get('/api/subjects/user')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/subjects/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            const subject = await mongoTestHelper.createSubject(manager, [])

            await request(app.getHttpServer())
                .get(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .expect(res => (res.body as SubjectDto).id === subject._id.toString())
        })

        it('should fail with 404, if no subjects were found', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })

            await request(app.getHttpServer())
                .get(`/api/subjects/${manager._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('called with a student, should throw 401', async () => {
            const student = await mongoTestHelper.createStudent()
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: student._id.toString(), role: Role.Student })
            const subject = await mongoTestHelper.createSubject(manager, [])

            await request(app.getHttpServer())
                .get(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/subjects/:subjectId/:lessonId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            const subject = await mongoTestHelper.createSubject(manager, [])
            const lesson = await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/${subject._id.toString()}/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)
        })

        it('should fail with 404 if subject does not exist', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            await mongoTestHelper.createSubject(manager, [])
            const lesson = await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/${manager._id.toString()}/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 404 if lesson does not exist', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            const subject = await mongoTestHelper.createSubject(manager, [])
            await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/${subject._id.toString()}/${manager._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 400 if invalid subjectId is given', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            await mongoTestHelper.createSubject(manager, [])
            const lesson = await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/strangeId/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.BAD_REQUEST)
        })

        it('should fail with 400 if invalid lessonId is given', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            await mongoTestHelper.createSubject(manager, [])
            const lesson = await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/strangeId/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.BAD_REQUEST)
        })

        it('should fail with 403 if called by student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id.toString(), role: student.role })
            const manager = await mongoTestHelper.createManager()
            const subject = await mongoTestHelper.createSubject(manager, [])
            const lesson = await mongoTestHelper.createLesson()

            await request(app.getHttpServer())
                .put(`/api/subjects/${subject._id.toString()}/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
