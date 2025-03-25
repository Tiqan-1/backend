import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { CreateTaskDto, UpdateTaskDto } from '../src/features/tasks/dto/task.dto'
import { TasksController } from '../src/features/tasks/tasks.controller'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import { ObjectId } from '../src/shared/repository/types'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('TasksController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [TasksController],
            providers: [
                TasksService,
                TasksRepository,
                LessonsService,
                LessonsRepository,
                SharedDocumentsService,
                JwtService,
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

    describe('POST /api/tasks/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const body: CreateTaskDto = {
                date: new Date(),
                lessonIds: [lesson._id.toString()],
            }

            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const response = await request(app.getHttpServer())
                .post('/api/tasks/')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const lesson = await mongoTestHelper.createLesson()
            const body: CreateTaskDto = {
                date: new Date(),
                lessonIds: [lesson._id.toString()],
            }

            const token = jwtService.sign({ id: student._id, role: student.role })
            await request(app.getHttpServer())
                .post('/api/tasks/')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('Get /api/tasks/:id', () => {
        it('should succeed when called by a manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const expected = {
                id: task._id.toString(),
                date: task.date.toISOString(),
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
                .get(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toEqual(expected)
        })

        it('should succeed when called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
        })

        it('should fail with 404 when called with an id that does not exist', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/tasks/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('Put /api/tasks/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const newLesson = await mongoTestHelper.createLesson()
            const body: UpdateTaskDto = {
                date: new Date(2020, 5),
                lessonIds: [newLesson._id.toString()],
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = await mongoTestHelper.getTaskModel().findById(task._id)

            expect(updated).toBeDefined()
            const expectedDate = new Date(2020, 5)
            expect(updated?.date).toEqual(expectedDate)
            expect(updated?.lessons).toEqual([newLesson._id])
        })

        it('should succeed when only updating date', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const body: UpdateTaskDto = {
                date: new Date(2020, 5),
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = await mongoTestHelper.getTaskModel().findById(task._id)

            expect(updated).toBeDefined()
            const expectedDate = new Date(2020, 5)
            expect(updated?.date).toEqual(expectedDate)
            expect(updated?.lessons).toEqual([lesson._id])
        })

        it('should succeed when only updating lessons', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const newLesson = await mongoTestHelper.createLesson()
            const body: UpdateTaskDto = {
                lessonIds: [newLesson._id.toString()],
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = await mongoTestHelper.getTaskModel().findById(task._id)

            expect(updated).toBeDefined()
            expect(updated?.date).toEqual(task.date)
            expect(updated?.lessons).toEqual([newLesson._id])
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            const body: UpdateTaskDto = {
                date: new Date(2020, 5),
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })

        it('should fail with 404 if called by an invalid id', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const body: UpdateTaskDto = {
                date: new Date(2020, 5),
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_FOUND)
        })
    })

    describe('Delete /api/tasks/:id', () => {
        it('should succeed when called by a manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            await request(app.getHttpServer())
                .delete(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deleted = await mongoTestHelper.getTaskModel().findById(task._id)
            expect(deleted).toBeNull()
        })

        it('should fail with 403 when called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })

        it('should fail with 404 when called with an id that does not exist', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            await request(app.getHttpServer())
                .delete(`/api/tasks/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })
    })
})
