import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelDocument } from '../src/features/levels/schemas/level.schema'
import { PaginatedTaskDto } from '../src/features/tasks/dto/paginated-task.dto'
import { CreateTaskDto, UpdateTaskDto } from '../src/features/tasks/dto/task.dto'
import { TaskState } from '../src/features/tasks/enums'
import { TaskDocument } from '../src/features/tasks/schemas/task.schema'
import { TasksController } from '../src/features/tasks/tasks.controller'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import { normalizeDate } from '../src/shared/helper/date.helper'
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

    describe('POST /api/tasks', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id)

            const body: CreateTaskDto = {
                levelId: level._id.toString(),
                date: new Date(),
                lessonIds: [lesson._id.toString()],
            }

            const response = await request(app.getHttpServer())
                .post(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()

            const created = (await mongoTestHelper.getTaskModel().findOne()) as TaskDocument
            expect(created).toBeDefined()
            expect(created.date).toEqual(normalizeDate(body.date))
            expect(created.lessons).toEqual([lesson._id])

            const updated = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(updated).toBeDefined()
            expect(updated.tasks.length).toEqual(1)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('Get /api/tasks', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const expected = [
                {
                    id: task._id.toString(),
                    date: task.date.toISOString(),
                    levelId: level._id.toString(),
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                },
            ]

            const response = await request(app.getHttpServer())
                .get(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedTaskDto
            expect(body.items).toEqual(expected)
        })

        it('should only return tasks created by manager calling the endpoint', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const manager2 = await mongoTestHelper.createManager('1')
            await mongoTestHelper.createTask(manager2._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const expected = [
                {
                    id: task._id.toString(),
                    date: task.date.toISOString(),
                    levelId: level._id.toString(),
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                },
            ]

            const response = await request(app.getHttpServer())
                .get(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedTaskDto
            expect(body.items).toEqual(expected)
        })

        it('should only return tasks selected by query', async () => {
            const date = new Date(2020, 5, 1)
            const date2 = new Date(2020, 5, 2)

            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            task.date = date
            await task.save()
            const level2 = await mongoTestHelper.createLevel(manager._id, program._id)
            const task2 = await mongoTestHelper.createTask(manager._id, level2._id, [lesson._id])
            task2.date = date
            await task2.save()
            const task3 = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            task3.date = date2
            await task3.save()
            level.tasks = [task._id, task3._id]
            await level.save()
            level2.tasks = [task2._id]
            await level2.save()

            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const expected = [
                {
                    id: task._id.toString(),
                    date: task.date.toISOString(),
                    levelId: level._id.toString(),
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                },
            ]

            const response = await request(app.getHttpServer())
                .get(`/api/tasks?levelId=${level._id.toString()}&date=${date.toISOString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedTaskDto
            expect(body.items).toEqual(expected)
        })

        it('should fail with 403 when called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
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

    describe('Get /api/tasks/:id', () => {
        it('should succeed when called by a manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const expected = {
                id: task._id.toString(),
                date: task.date.toISOString(),
                levelId: level._id.toString(),
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
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
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
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const newLesson = await mongoTestHelper.createLesson(manager._id)
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
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
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
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const newLesson = await mongoTestHelper.createLesson(manager._id)
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
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
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
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            await request(app.getHttpServer())
                .delete(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deleted = (await mongoTestHelper.getTaskModel().findById(task._id)) as TaskDocument
            expect(deleted.state).toEqual(TaskState.deleted)
        })

        it('should fail with 403 when called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
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

    describe('DELETE /api/tasks/:taskId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id)
            level.tasks = [task._id]
            await level.save()

            await request(app.getHttpServer())
                .delete(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(updated).toBeDefined()
            expect(updated.tasks.length).toEqual(0)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/tasks/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
