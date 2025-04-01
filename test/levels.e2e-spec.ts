import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelDto, UpdateLevelDto } from '../src/features/levels/dto/level.dto'
import { LevelsController } from '../src/features/levels/levels.controller'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { LevelDocument } from '../src/features/levels/schemas/level.schema'
import { CreateTaskDto, TaskDto } from '../src/features/tasks/dto/task.dto'
import { TaskDocument } from '../src/features/tasks/schemas/task.schema'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import { normalizeDate } from '../src/shared/helper/date.helper'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('LevelsController', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [LevelsController],
            providers: [
                LevelsService,
                LevelsRepository,
                TasksService,
                TasksRepository,
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

    describe('GET /api/levels/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const level = await mongoTestHelper.createLevel([task._id])

            const response = await request(app.getHttpServer())
                .get(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response).toBeDefined()
            const body = response.body as LevelDto

            expect(body.name).toEqual(level.name)
            expect(body.start).toEqual(level.start.toISOString())
            expect(body.end).toEqual(level.end.toISOString())
            expect(body.tasks).toEqual([
                {
                    id: task._id.toString(),
                    date: task.date.toISOString(),
                    lessons: [{ id: lesson._id.toString(), url: lesson.url, type: lesson.type, title: lesson.title }],
                },
            ])
        })
    })

    describe('PUT /api/levels/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])

            const body: UpdateLevelDto = {
                start: new Date(),
            }

            await request(app.getHttpServer())
                .put(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(updated).toBeDefined()
            expect(updated.start).toEqual(body.start)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const level = await mongoTestHelper.createLevel([])

            await request(app.getHttpServer())
                .put(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/levels/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])

            await request(app.getHttpServer())
                .delete(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const levels = await mongoTestHelper.getProgramModel().find()
            expect(levels).toHaveLength(0)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const level = await mongoTestHelper.createLevel([])

            await request(app.getHttpServer())
                .delete(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('POST /api/levels/:id/tasks', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const level = await mongoTestHelper.createLevel([])

            const body: CreateTaskDto = {
                date: new Date(),
                lessonIds: [lesson._id.toString()],
            }

            const response = await request(app.getHttpServer())
                .post(`/api/levels/${level._id.toString()}/tasks`)
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
                .post(`/api/levels/anyId/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/levels/:id/tasks', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const level = await mongoTestHelper.createLevel([task._id])

            const response = await request(app.getHttpServer())
                .get(`/api/levels/${level._id.toString()}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const [receivedTask] = response.body as TaskDto[]
            expect(receivedTask).toBeDefined()
            expect(receivedTask.id).toEqual(task._id.toString())
            expect(receivedTask.date).toEqual(normalizeDate(task.date).toISOString())
            expect(receivedTask.lessons[0]).toBeDefined()
            expect(receivedTask.lessons[0].id).toEqual(lesson._id.toString())
            expect(receivedTask.lessons[0].url).toEqual(lesson.url)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/levels/anyId/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/levels/:levelId/tasks/:taskId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const task = await mongoTestHelper.createTask([])
            const level = await mongoTestHelper.createLevel([task._id])

            await request(app.getHttpServer())
                .delete(`/api/levels/${level._id.toString()}/tasks/${task._id.toString()}`)
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
                .delete(`/api/levels/anyId/tasks/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
