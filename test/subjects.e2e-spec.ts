import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { CreateLessonDto, LessonDto } from '../src/features/lessons/dto/lesson.dto'
import { LessonType } from '../src/features/lessons/enums/lesson-type.enum'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LessonDocument } from '../src/features/lessons/schemas/lesson.schema'
import { CreateSubjectDto, SubjectDto } from '../src/features/subjects/dto/subject.dto'
import { SubjectDocument } from '../src/features/subjects/schemas/subject.schema'
import { SubjectsController } from '../src/features/subjects/subjects.controller'
import { SubjectsRepository } from '../src/features/subjects/subjects.repository'
import { SubjectsService } from '../src/features/subjects/subjects.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
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
                SharedDocumentsService,
                JwtStrategy,
                ConfigServiceProvider,
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

    describe('POST /api/subjects/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const body: CreateSubjectDto = {
                name: 'subject name',
                description: 'description',
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
            const subject1 = await mongoTestHelper.createSubject([], manager._id)
            const subject2 = await mongoTestHelper.createSubject([], manager._id)

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
            const subject1 = await mongoTestHelper.createSubject([], manager._id)
            const subject2 = await mongoTestHelper.createSubject([], manager._id)

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
            const subject1 = await mongoTestHelper.createSubject([], manager1._id)

            const manager2 = await mongoTestHelper.createManager('2')
            await mongoTestHelper.createSubject([], manager2._id)

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
            const subject = await mongoTestHelper.createSubject([], manager._id)

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
            const subject = await mongoTestHelper.createSubject([], manager._id)

            await request(app.getHttpServer())
                .get(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('POST /api/subjects/:id/lessons', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject([], manager._id)

            const body: CreateLessonDto = {
                url: 'test url',
                type: LessonType.Pdf,
                title: 'test title',
            }

            const response = await request(app.getHttpServer())
                .post(`/api/subjects/${subject._id.toString()}/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()

            const created = (await mongoTestHelper.getLessonModel().findOne()) as LessonDocument
            expect(created).toBeDefined()
            expect(created.url).toEqual(body.url)
            expect(created.type).toEqual(body.type)
            expect(created.title).toEqual(body.title)

            const updated = (await mongoTestHelper.getSubjectModel().findOne()) as SubjectDocument
            expect(updated).toBeDefined()
            expect(updated.lessons.length).toEqual(1)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post(`/api/subjects/anyId/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/subjects/:id/lessons', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const subject = await mongoTestHelper.createSubject([lesson._id], manager._id)

            const response = await request(app.getHttpServer())
                .get(`/api/subjects/${subject._id.toString()}/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const [receivedLesson] = response.body as LessonDto[]
            expect(receivedLesson).toBeDefined()
            expect(receivedLesson.id).toEqual(lesson._id.toString())
            expect(receivedLesson.url).toEqual(lesson.url)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/subjects/anyId/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/subjects/:subjectId/lessons/:lessonId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const subject = await mongoTestHelper.createSubject([lesson._id], manager._id)

            await request(app.getHttpServer())
                .delete(`/api/subjects/${subject._id.toString()}/lessons/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getSubjectModel().findOne()) as SubjectDocument
            expect(updated).toBeDefined()
            expect(updated.lessons.length).toEqual(0)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/subjects/anyId/lessons/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
