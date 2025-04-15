import multipart from '@fastify/multipart'
import { HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test, TestingModule } from '@nestjs/testing'
import * as fs from 'node:fs'
import path from 'path'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vitest } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { CreateLevelDto, LevelDto } from '../src/features/levels/dto/level.dto'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { LevelDocument } from '../src/features/levels/schemas/level.schema'
import { ProgramDto } from '../src/features/programs/dto/program.dto'
import { ProgramState } from '../src/features/programs/enums/program-state.enum'
import { ProgramsController } from '../src/features/programs/programs.controller'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { ProgramsThumbnailsRepository } from '../src/features/programs/programs.thumbnails.repository'
import { ProgramDocument } from '../src/features/programs/schemas/program.schema'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { oneMonth } from '../src/shared/constants'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('ProgramsController (e2e)', () => {
    let app: NestFastifyApplication
    let jwtService: JwtService
    let configService: ConfigService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [ProgramsController],
            providers: [
                ProgramsService,
                ProgramsRepository,
                ProgramsThumbnailsRepository,
                LevelsService,
                LevelsRepository,
                TasksService,
                TasksRepository,
                LessonsService,
                LessonsRepository,
                JwtStrategy,
                SharedDocumentsService,
                ConfigServiceProvider,
                ...mongoTestHelper.providers,
            ],
        }).compile()

        jwtService = module.get(JwtService)
        configService = module.get(ConfigService)
        mockJwtStrategyValidation(module)

        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ logger: true }))
        await app.init()
        await app.register(multipart)
        await app.getHttpAdapter().getInstance().ready()
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
        await app.close()
        const folderPath = path.join(__dirname, '..', configService.get('UPLOAD_FOLDER') as string) // Replace with your folder path

        fs.rmSync(folderPath, { recursive: true, force: true })
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    describe('GET /api/programs/enriched', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)

            vitest
                .spyOn(ProgramsThumbnailsRepository.prototype, 'findOne')
                .mockImplementation(thumbnail => Promise.resolve(`base64-${thumbnail}`))

            const response = await request(app.getHttpServer())
                .get('/api/programs/enriched')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const found = response.body as ProgramDto[]
            expect(found.length).toEqual(1)
            expect(found[0].id).toEqual(program._id.toString())
            expect(found[0].thumbnail).toEqual(`base64-${program.thumbnail}`)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            await request(app.getHttpServer())
                .get('/api/programs/enriched')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/programs/enriched/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)

            vitest
                .spyOn(ProgramsThumbnailsRepository.prototype, 'findOne')
                .mockImplementation(thumbnail => Promise.resolve(`base64-${thumbnail}`))

            const response = await request(app.getHttpServer())
                .get(`/api/programs/enriched/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
            expect(response.body).toBeDefined()
            const found = response.body as ProgramDto
            expect(found.id).toEqual(program._id.toString())
            expect(found.state).toEqual(ProgramState.created)
            expect(found.thumbnail).toEqual(`base64-${program.thumbnail}`)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram([], manager._id)

            await request(app.getHttpServer())
                .get(`/api/programs/enriched/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/programs/search', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)
            const otherProgram = await mongoTestHelper.createProgram([], manager._id)

            // change other program so is won't be found
            otherProgram.name = 'other'
            otherProgram.description = 'other'
            otherProgram.state = ProgramState.published
            otherProgram.start = new Date(oneMonth.valueOf())
            await otherProgram.save()

            const name = program.name
            const description = program.description
            const state = program.state
            const start = new Date(program.start.valueOf() - oneMonth.valueOf())

            vitest
                .spyOn(ProgramsThumbnailsRepository.prototype, 'findOne')
                .mockImplementation(thumbnail => Promise.resolve(`base64-${thumbnail}`))

            const response = await request(app.getHttpServer())
                .get(`/api/programs/search?name=${name}&description=${description}&state=${state}&start=${start.toISOString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const found = response.body as ProgramDto[]
            expect(found.length).toEqual(1)
            expect(found[0].id).toEqual(program._id.toString())
            expect(found[0].thumbnail).toEqual(`base64-${program.thumbnail}`)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/programs/search`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/programs/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)

            const updateBody = {
                state: ProgramState.published,
            }

            await request(app.getHttpServer())
                .put(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateBody)
                .expect(HttpStatus.NO_CONTENT)

            const found = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(found.state).toEqual(ProgramState.published)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram([], manager._id)

            await request(app.getHttpServer())
                .put(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('POST /api/programs/:id/thumbnail', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)

            await request(app.getHttpServer())
                .post(`/api/programs/${program._id.toString()}/thumbnail`)
                .set('Content-Type', 'multipart/form-data')
                .set('Authorization', `Bearer ${token}`)
                .attach('thumbnail', path.join(__dirname, 'test-image.jpg'))
                .expect(HttpStatus.NO_CONTENT)

            const found = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(found.thumbnail).toBeDefined()
            expect(found.thumbnail).toContain('test-image.jpg')
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram([], manager._id)

            await request(app.getHttpServer())
                .post(`/api/programs/${program._id.toString()}/thumbnail`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('POST /api/programs/:id/levels', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([], manager._id)

            const body: CreateLevelDto = {
                name: 'level name',
                start: new Date(),
                end: new Date(),
            }

            const response = await request(app.getHttpServer())
                .post(`/api/programs/${program._id.toString()}/levels`)
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
                .post(`/api/programs/anyId/levels`)
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/programs/:id/levels', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson()
            const task = await mongoTestHelper.createTask([lesson._id])
            const level = await mongoTestHelper.createLevel([task._id])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)

            const response = await request(app.getHttpServer())
                .get(`/api/programs/${program._id.toString()}/levels`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const [receivedLevel] = response.body as LevelDto[]
            expect(receivedLevel).toBeDefined()
            expect(receivedLevel.id).toEqual(level._id.toString())
            expect(receivedLevel.start).toEqual(level.start.toISOString())
            expect(receivedLevel.tasks[0]).toBeDefined()
            expect(receivedLevel.tasks[0].id).toEqual(task._id.toString())
            expect(receivedLevel.tasks[0].date).toEqual(task.date.toISOString())
            expect(receivedLevel.tasks[0].lessons[0]).toBeDefined()
            expect(receivedLevel.tasks[0].lessons[0].id).toEqual(lesson._id.toString())
            expect(receivedLevel.tasks[0].lessons[0].url).toEqual(lesson.url)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/programs/anyId/levels`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/programs/:programId/levels/:levelId', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)

            await request(app.getHttpServer())
                .delete(`/api/programs/${program._id.toString()}/levels/${level._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(updated).toBeDefined()
            expect(updated.levels.length).toEqual(0)
        })

        it('should fail if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/programs/anyId/levels/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
