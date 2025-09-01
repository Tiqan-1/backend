import { HttpStatus, INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { I18nService } from 'nestjs-i18n'
import { PusherService } from 'nestjs-pusher'
import * as fs from 'node:fs'
import path from 'path'
import { ObjectId } from 'src/shared/repository/types'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { ChatRepository } from '../src/features/chat/chat.repository'
import { ChatService } from '../src/features/chat/chat.service'
import { MessageRepository } from '../src/features/chat/message.repository'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { ManagerDocument } from '../src/features/managers/schemas/manager.schema'
import { CreateProgramDto } from '../src/features/programs/dto/program.dto'
import { ProgramState } from '../src/features/programs/enums/program-state.enum'
import { ProgramSubscriptionType } from '../src/features/programs/enums/program-subscription-type.enum'
import { ProgramsController } from '../src/features/programs/programs.controller'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { ProgramsThumbnailsRepository } from '../src/features/programs/programs.thumbnails.repository'
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

describe('ProgramsController (e2e)', () => {
    let app: INestApplication<App>
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
                ChatService,
                ChatRepository,
                MessageRepository,
                { provide: I18nService, useValue: { t: vi.fn() } },
                { provide: PusherService, useValue: { trigger: vi.fn() } },
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

        app = module.createNestApplication()
        await app.init()
        // await app.getHttpAdapter().getInstance().ready()
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
        await app.close()
        const folderPath = path.join(__dirname, '..', configService.get('UPLOAD_FOLDER') as string)

        fs.rmSync(folderPath, { recursive: true, force: true })
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    describe('POST /api/programs', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const body: CreateProgramDto = {
                name: 'program name',
                description: 'program description',
                start: new Date(),
                end: new Date(),
                registrationStart: new Date(),
                registrationEnd: new Date(),
                programSubscriptionType: ProgramSubscriptionType.public,
            }

            const response = await request(app.getHttpServer())
                .post('/api/programs')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const created = response.body as CreatedDto
            expect(created.id).toBeDefined()

            const found = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(found).toBeDefined()
            expect(found.name).toEqual(body.name)
            expect(found.description).toEqual(body.description)
            expect(found.start).toEqual(body.start)
            expect(found.state).toEqual(ProgramState.created)
            expect(found.createdBy).toEqual(manager._id)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post('/api/programs')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/programs/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id, [level._id])
            manager.programs = [program._id]
            await manager.save()

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

        it('should fail with 409 when trying to publish a program which has no levels', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            manager.programs = [program._id]
            await manager.save()

            const updateBody = {
                state: ProgramState.published,
            }

            await request(app.getHttpServer())
                .put(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateBody)
                .expect(HttpStatus.CONFLICT)
        })

        it('should fail with 404 if called with a non-existent program id', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const updateBody = {
                state: ProgramState.published,
            }

            await request(app.getHttpServer())
                .put(`/api/programs/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateBody)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 404 if called with a program id that does not belong to the current manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const creator = await mongoTestHelper.createManager('1')
            const program = await mongoTestHelper.createProgram(creator._id)
            creator.programs = [program._id]
            await creator.save()

            const updateBody = {
                state: ProgramState.published,
            }

            await request(app.getHttpServer())
                .put(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateBody)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)

            await request(app.getHttpServer())
                .put(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/programs/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            manager.programs = [program._id]
            await manager.save()

            await request(app.getHttpServer())
                .delete(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const found = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(found.state).toEqual(ProgramState.deleted)

            const foundManager = (await mongoTestHelper.getManagerModel().findOne()) as ManagerDocument
            expect(foundManager.programs.length).toEqual(0)
        })

        it('should fail with 404 called with a non-existent program id', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            await request(app.getHttpServer())
                .delete(`/api/programs/${new ObjectId().toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 404 called with a program id that does not belong to the current manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const creator = await mongoTestHelper.createManager('1')
            const program = await mongoTestHelper.createProgram(creator._id)
            creator.programs = [program._id]
            await creator.save()

            await request(app.getHttpServer())
                .delete(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/programs/any`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('POST /api/programs/:id/thumbnail', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)

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
            const program = await mongoTestHelper.createProgram(manager._id)

            await request(app.getHttpServer())
                .post(`/api/programs/${program._id.toString()}/thumbnail`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
