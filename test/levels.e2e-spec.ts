import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { Lesson } from '../src/features/lessons/schemas/lesson.schema'
import { CreateLevelDto, LevelDto } from '../src/features/levels/dto/level.dto'
import { LevelsController } from '../src/features/levels/levels.controller'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { Level, LevelDocument } from '../src/features/levels/schemas/level.schema'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { Manager } from '../src/features/managers/schemas/manager.schema'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { Program, ProgramDocument } from '../src/features/programs/schemas/program.schema'
import { Task } from '../src/features/tasks/schemas/task.schema'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
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
                ProgramsService,
                ProgramsRepository,
                TasksService,
                TasksRepository,
                ManagersService,
                ManagersRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                LessonsService,
                LessonsRepository,
                JwtStrategy,
                JwtService,
                ConfigServiceProvider,
                { provide: getModelToken(Level.name), useValue: mongoTestHelper.getLevelModel() },
                { provide: getModelToken(Program.name), useValue: mongoTestHelper.getProgramModel() },
                { provide: getModelToken(Manager.name), useValue: mongoTestHelper.getManagerModel() },
                { provide: getModelToken(User.name), useValue: mongoTestHelper.getUserModel() },
                { provide: getModelToken(RefreshToken.name), useValue: mongoTestHelper.getRefreshTokenModel() },
                { provide: getModelToken(Task.name), useValue: mongoTestHelper.getTaskModel() },
                { provide: getModelToken(Lesson.name), useValue: mongoTestHelper.getLessonModel() },
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

    describe('POST /api/levels/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lessons = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lessons._id])
            const program = await mongoTestHelper.createProgram([])

            const body: CreateLevelDto = {
                programId: program._id.toString(),
                name: 'level name',
                start: new Date(),
                end: new Date(),
                taskIds: [task._id.toString()],
            }

            const response = await request(app.getHttpServer())
                .post('/api/levels/')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()

            const created = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(created).toBeDefined()
            expect(created.name).toEqual('level name')
            expect(created.start).toBeDefined()
            expect(created.end).toBeDefined()
            expect(created.tasks).toBeDefined()
            expect(created.tasks[0]).toEqual(task._id)

            // assure that level got added to the program
            const updatedProgram = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(updatedProgram.levels).toEqual([created._id])
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const program = await mongoTestHelper.createProgram([])

            const body: CreateLevelDto = {
                programId: program._id.toString(),
                name: 'level name',
                start: new Date(),
                end: new Date(),
                taskIds: [],
            }

            await request(app.getHttpServer())
                .post('/api/levels/')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })
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
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const level = await mongoTestHelper.createLevel([])

            const body = {
                taskIds: [task._id.toString()],
            }

            await request(app.getHttpServer())
                .put(`/api/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(updated).toBeDefined()
            expect(updated.tasks).toEqual([task._id])
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
})
