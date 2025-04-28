import { HttpStatus, INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { CreateLessonDto, UpdateLessonDto } from '../src/features/lessons/dto/lesson.dto'
import { PaginatedLessonDto } from '../src/features/lessons/dto/paginated-lesson.dto'
import { LessonState } from '../src/features/lessons/enums/lesson-state.enum'
import { LessonType } from '../src/features/lessons/enums/lesson-type.enum'
import { LessonsController } from '../src/features/lessons/lessons.controller'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LessonDocument } from '../src/features/lessons/schemas/lesson.schema'
import { SubjectDocument } from '../src/features/subjects/schemas/subject.schema'
import { SharedDocumentsService } from '../src/shared/./database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const configService = { get: vi.fn().mockReturnValue('secret') }

describe('LessonsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'secret',
                    signOptions: { expiresIn: '1d' },
                }),
            ],
            controllers: [LessonsController],
            providers: [
                LessonsService,
                LessonsRepository,
                JwtService,
                JwtStrategy,
                SharedDocumentsService,
                { provide: ConfigService, useValue: configService },
                ...mongoTestHelper.providers,
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

    describe('POST /api/lessons', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)

            const body: CreateLessonDto = {
                url: 'test url',
                type: LessonType.pdf,
                title: 'test title',
                subjectId: subject._id.toString(),
            }

            const response = await request(app.getHttpServer())
                .post(`/api/lessons`)
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
                .post(`/api/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/lessons', () => {
        it('should succeed without query parameters', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson1 = await mongoTestHelper.createLesson(manager._id)
            const lesson2 = await mongoTestHelper.createLesson(manager._id)

            const response = await request(app.getHttpServer())
                .get('/api/lessons')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(2)
            expect(body.items[0].id).toEqual(lesson1._id.toString())
            expect(body.items[1].id).toEqual(lesson2._id.toString())
        })

        it('should only return lessons of the subject', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            const lesson1 = await mongoTestHelper.createLesson(manager._id, subject._id)
            await mongoTestHelper.createLesson(manager._id)
            subject.lessons = [lesson1._id]
            await subject.save()

            const response = await request(app.getHttpServer())
                .get(`/api/lessons?subjectId=${subject.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(1)
            expect(body.items[0].id).toEqual(lesson1._id.toString())
        })

        it('should only return lessons created by the same manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson1 = await mongoTestHelper.createLesson(manager._id)

            const manager2 = await mongoTestHelper.createManager('2')
            await mongoTestHelper.createLesson(manager2._id)

            const response = await request(app.getHttpServer())
                .get(`/api/lessons`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(1)
            expect(body.items[0].id).toEqual(lesson1._id.toString())
        })

        it('should only return lessons matching query', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            const lesson1 = await mongoTestHelper.createLesson(manager._id, subject._id)
            const lesson2 = await mongoTestHelper.createLesson(manager._id, subject._id)
            lesson2.type = LessonType.other
            await lesson2.save()
            const lesson3 = await mongoTestHelper.createLesson(manager._id)
            await mongoTestHelper.createLesson(manager._id)
            subject.lessons = [lesson1._id, lesson2._id]
            await subject.save()

            const response = await request(app.getHttpServer())
                .get(`/api/lessons?subjectId=${subject.id}&type=${LessonType.video}&url=${lesson3.url}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(1)
            expect(body.items[0].id).toEqual(lesson1._id.toString())
        })

        it('should match id of lesson only if in given subject', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            const lesson = await mongoTestHelper.createLesson(manager._id)

            const response = await request(app.getHttpServer())
                .get(`/api/lessons?subjectId=${subject.id}&id=${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(0)
        })

        it('should match id of lesson when no subject id is provided', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson1 = await mongoTestHelper.createLesson(manager._id)
            await mongoTestHelper.createLesson(manager._id)

            const response = await request(app.getHttpServer())
                .get(`/api/lessons?id=${lesson1._id.toString()}&type=${LessonType.video}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLessonDto
            expect(body.items).toHaveLength(1)
            expect(body.items[0].id).toEqual(lesson1._id.toString())
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })

            await request(app.getHttpServer())
                .get('/api/lessons')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/lessons/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson(manager._id)

            const body: UpdateLessonDto = {
                type: LessonType.pdf,
                url: 'pdf url',
            }

            await request(app.getHttpServer())
                .put(`/api/lessons/${lesson.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const document = (await mongoTestHelper.getLessonModel().findOne()) as LessonDocument
            expect(document._id.toString()).toEqual(lesson._id.toString())
            expect(document.type).toEqual(body.type)
            expect(document.url).toEqual(body.url)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })

            await request(app.getHttpServer())
                .put('/api/lessons/anyId')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/lessons/:lessonId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            const lesson = await mongoTestHelper.createLesson(manager._id, subject._id)
            subject.lessons = [lesson._id]
            await subject.save()

            await request(app.getHttpServer())
                .delete(`/api/lessons/${lesson._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getSubjectModel().findOne()) as SubjectDocument
            expect(updated).toBeDefined()
            expect(updated.lessons.length).toEqual(0)

            const deleted = (await mongoTestHelper.getLessonModel().findOne()) as LessonDocument
            expect(deleted.state).toEqual(LessonState.deleted)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/lessons/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
