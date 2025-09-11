import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { ObjectId } from 'src/shared/repository/types'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { ManagerDocument } from '../src/features/managers/schemas/manager.schema'
import { CreateSubjectDto, UpdateSubjectDto } from '../src/features/subjects/dto/subject.dto'
import { SubjectState } from '../src/features/subjects/enums/subject-state'
import { PaginatedSubjectDto } from '../src/features/subjects/paginated-subject.dto'
import { SubjectDocument } from '../src/features/subjects/schemas/subject.schema'
import { SubjectsController } from '../src/features/subjects/subjects.controller'
import { SubjectsRepository } from '../src/features/subjects/subjects.repository'
import { SubjectsService } from '../src/features/subjects/subjects.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'
import { I18nService } from 'nestjs-i18n'

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
                { provide: I18nService, useValue: { t: vi.fn() } },
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

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
            })
        )
        await app.init()
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
        await app.close()
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    describe('POST /api/subjects', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const body: CreateSubjectDto = {
                name: 'test subject',
                description: 'test description',
            }

            const response = await request(app.getHttpServer())
                .post('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()

            const created = (await mongoTestHelper.getSubjectModel().findOne()) as SubjectDocument
            expect(created).toBeDefined()
            expect(created.name).toEqual(body.name)
            expect(created.description).toEqual(body.description)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/subjects/', () => {
        it('should succeed when called without query parameters', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            const subject1 = await mongoTestHelper.createSubject(manager._id)
            const subject2 = await mongoTestHelper.createSubject(manager._id)

            const response = await request(app.getHttpServer())
                .get('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const responseBody = response.body as PaginatedSubjectDto
            expect(responseBody.items.length).toEqual(2)
            const ids = responseBody.items.map(s => s.id)
            expect(ids).toContain(subject1._id.toString())
            expect(ids).toContain(subject2._id.toString())
        })

        it('should succeed and return only subjects selected by query', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
            const subject1 = await mongoTestHelper.createSubject(manager._id)
            const subject2 = await mongoTestHelper.createSubject(manager._id)
            subject2.name = 'another name'
            await subject2.save()

            const response = await request(app.getHttpServer())
                .get(`/api/subjects?name=${subject1.name}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const responseBody = response.body as PaginatedSubjectDto
            expect(responseBody.items.length).toEqual(1)
            expect(responseBody.items[0].id).toEqual(subject1._id.toString())
        })

        it('called with a student, should throw 403', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            await request(app.getHttpServer())
                .get('/api/subjects')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })

        describe('pagination', () => {
            it('should succeed when called with a page size of 1', async () => {
                const manager = await mongoTestHelper.createManager()
                const token = jwtService.sign({ id: manager._id.toString(), role: Role.Manager })
                const subject1 = await mongoTestHelper.createSubject(manager._id)
                const subject2 = await mongoTestHelper.createSubject(manager._id)
                const subject3 = await mongoTestHelper.createSubject(manager._id)

                const response1 = await request(app.getHttpServer())
                    .get('/api/subjects?pageSize=1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.OK)

                expect(response1.body).toBeDefined()
                const responseBody1 = response1.body as PaginatedSubjectDto
                expect(responseBody1.items.length).toEqual(1)
                expect(responseBody1.items[0].id).toEqual(subject1._id.toString()) // should return first subject
                expect(responseBody1.total).toEqual(3)
                expect(responseBody1.page).toEqual(1)
                expect(responseBody1.pageSize).toEqual(1)

                const response2 = await request(app.getHttpServer())
                    .get('/api/subjects?page=2&pageSize=1')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.OK)

                expect(response2.body).toBeDefined()
                const responseBody2 = response2.body as PaginatedSubjectDto
                expect(responseBody2.items.length).toEqual(1)
                expect(responseBody2.items[0].id).toEqual(subject2._id.toString()) // should return second subject
                expect(responseBody2.total).toEqual(3)
                expect(responseBody2.page).toEqual(2)
                expect(responseBody2.pageSize).toEqual(1)

                const response3 = await request(app.getHttpServer())
                    .get('/api/subjects?page=2&pageSize=2')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.OK)

                expect(response3.body).toBeDefined()
                const responseBody3 = response3.body as PaginatedSubjectDto
                expect(responseBody3.items.length).toEqual(1)
                expect(responseBody3.items[0].id).toEqual(subject3._id.toString())
                expect(responseBody3.total).toEqual(3)
                expect(responseBody3.page).toEqual(2)
                expect(responseBody3.pageSize).toEqual(2)
            })
        })
    })

    describe('DELETE /api/subjects/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            manager.subjects = [subject._id]
            await manager.save()

            await request(app.getHttpServer())
                .delete(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deleted = (await mongoTestHelper.getSubjectModel().findById(subject._id)) as SubjectDocument
            expect(deleted.state).toEqual(SubjectState.deleted)

            const updatedManager = (await mongoTestHelper.getManagerModel().findById(manager._id)) as ManagerDocument
            expect(updatedManager.subjects.length).toEqual(0)
        })

        it('should throw 404 when called with a non existing id', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })

            await request(app.getHttpServer())
                .delete('/api/subjects/any')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should throw 404 when called by a manager that does not own the subject', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })
            const creator = await mongoTestHelper.createManager('1')
            const subject = await mongoTestHelper.createSubject(creator._id)
            creator.subjects = [subject._id]
            await creator.save()

            await request(app.getHttpServer())
                .delete(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('called with a student, should throw 403', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })

            await request(app.getHttpServer())
                .delete('/api/subjects/any')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/subjects/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const subject = await mongoTestHelper.createSubject(manager._id)
            manager.subjects = [subject._id]
            await manager.save()

            const body: UpdateSubjectDto = {
                name: 'new subject',
                description: 'new description',
            }

            await request(app.getHttpServer())
                .put(`/api/subjects/${subject.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const document = (await mongoTestHelper.getSubjectModel().findOne()) as SubjectDocument
            expect(document._id.toString()).toEqual(subject._id.toString())
            expect(document.name).toEqual(body.name)
            expect(document.description).toEqual(body.description)
        })

        it('should throw 404 when called with a non existing id', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })

            await request(app.getHttpServer())
                .put(`/api/subjects/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should throw 404 when called by a manager that does not own the subject', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: Role.Manager })
            const creator = await mongoTestHelper.createManager('1')
            const subject = await mongoTestHelper.createSubject(creator._id)
            creator.subjects = [subject._id]
            await creator.save()

            await request(app.getHttpServer())
                .put(`/api/subjects/${subject._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })

            await request(app.getHttpServer())
                .put('/api/subjects/anyId')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
