import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { I18nService } from 'nestjs-i18n'
import { PusherService } from 'nestjs-pusher'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AssignmentsRepository } from '../src/features/assignments/assignments.repository'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { ChatRepository } from '../src/features/chat/chat.repository'
import { ChatService } from '../src/features/chat/chat.service'
import { MessageRepository } from '../src/features/chat/message.repository'
import { LessonState } from '../src/features/lessons/enums/lesson-state.enum'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { CreateLevelDto, UpdateLevelDto } from '../src/features/levels/dto/level.dto'
import { PaginatedLevelDto } from '../src/features/levels/dto/paginated-level.dto'
import { LevelState } from '../src/features/levels/enums/level-stats.enum'
import { LevelsController } from '../src/features/levels/levels.controller'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { LevelDocument } from '../src/features/levels/schemas/level.schema'
import { ProgramDocument } from '../src/features/programs/schemas/program.schema'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
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
                ChatService,
                ChatRepository,
                MessageRepository,
                { provide: I18nService, useValue: { t: vi.fn() } },
                { provide: PusherService, useValue: { trigger: vi.fn() } },
                AssignmentsRepository,
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

    describe('POST /api/levels', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)

            const body: CreateLevelDto = {
                name: 'level name',
                start: new Date(),
                end: new Date(),
                programId: program._id.toString(),
            }

            const response = await request(app.getHttpServer())
                .post(`/api/levels`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()

            const created = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(created).toBeDefined()
            expect(created.start).toEqual(body.start)
            expect(created.end).toEqual(body.end)

            const updated = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(updated).toBeDefined()
            expect(updated.levels.length).toEqual(1)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post(`/api/levels`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/levels', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()

            const response = await request(app.getHttpServer())
                .get(`/api/levels`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLevelDto
            const [receivedLevel] = body.items
            expect(receivedLevel).toBeDefined()
            expect(receivedLevel.id).toEqual(level._id.toString())
            expect(receivedLevel.start).toEqual(level.start.toISOString())
            expect(receivedLevel.createdBy).toEqual({ name: manager.name, email: manager.email })
            expect(receivedLevel.programId).toEqual(program._id.toString())
            expect(receivedLevel.tasks[0]).toBeDefined()
            expect(receivedLevel.tasks[0].id).toEqual(task._id.toString())
            expect(receivedLevel.tasks[0].date).toEqual(task.date.toISOString())
            expect(receivedLevel.tasks[0].lessons[0]).toBeDefined()
            expect(receivedLevel.tasks[0].lessons[0].id).toEqual(lesson._id.toString())
            expect(receivedLevel.tasks[0].lessons[0].url).toEqual(lesson.url)
        })

        it('should not return deleted levels', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            level.state = LevelState.deleted
            await level.save()

            const response = await request(app.getHttpServer())
                .get(`/api/levels`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedLevelDto
            expect(body.items).to.have.lengthOf(0)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/levels`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/levels/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel(manager._id)

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
            const level = await mongoTestHelper.createLevel(student._id)

            await request(app.getHttpServer())
                .put(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/levels/:levelId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()

            await request(app.getHttpServer())
                .delete(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(updated).toBeDefined()
            expect(updated.levels.length).toEqual(0)

            const deleted = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(deleted.state).toEqual(LessonState.deleted)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/levels/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
