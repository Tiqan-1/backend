import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { ManagerDocument } from '../src/features/managers/schemas/manager.schema'
import { CreateProgramDto, ProgramDto } from '../src/features/programs/dto/program.dto'
import { ProgramState } from '../src/features/programs/enums/program-state.enum'
import { ProgramsController } from '../src/features/programs/programs.controller'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { ProgramDocument } from '../src/features/programs/schemas/program.schema'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
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
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [ProgramsController],
            providers: [
                ProgramsService,
                ProgramsRepository,
                ManagersService,
                ManagersRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                JwtService,
                JwtStrategy,
                SharedDocumentsService,
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

    describe('POST /api/programs/managers', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const date = new Date()
            const body: CreateProgramDto = {
                name: 'program name',
                start: new Date(date.valueOf()),
                registrationStart: new Date(date.setMonth(date.getMonth() + 1)),
                registrationEnd: new Date(date.setMonth(date.getMonth() + 2)),
                end: new Date(date.setFullYear(date.getFullYear() + 1)),
                description: 'program description',
            }

            const response = await request(app.getHttpServer())
                .post('/api/programs/managers')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)
            expect(response.body).toBeDefined()

            const { id } = response.body as CreatedDto
            expect(id).toBeDefined()
            const created = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(created).toBeDefined()
            expect(created._id.toString()).toEqual(id)

            const creator = (await mongoTestHelper.getManagerModel().findOne()) as ManagerDocument
            expect(creator.programs[0]).toEqual(created._id)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .post('/api/programs/managers')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/programs', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            await request(app.getHttpServer())
                .get('/api/programs')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .expect([])
        })
    })

    describe('GET /api/programs/managers', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            await request(app.getHttpServer())
                .get('/api/programs/managers')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
                .expect([])
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            await request(app.getHttpServer())
                .get('/api/programs/managers')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/programs/:id', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const program = await mongoTestHelper.createProgram([])

            const response = await request(app.getHttpServer())
                .get(`/api/programs/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
            expect(response.body).toBeDefined()
            const found = response.body as ProgramDto
            expect(found.id).toEqual(program._id.toString())
            expect(found.state).toBeUndefined()
        })
    })

    describe('GET /api/programs/managers/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([])

            const response = await request(app.getHttpServer())
                .get(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)
            expect(response.body).toBeDefined()
            const found = response.body as ProgramDto
            expect(found.id).toEqual(program._id.toString())
            expect(found.state).toEqual(ProgramState.created)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const program = await mongoTestHelper.createProgram([])

            await request(app.getHttpServer())
                .get(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT /api/programs/managers/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([])

            const updateBody = {
                state: ProgramState.published,
            }

            await request(app.getHttpServer())
                .put(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateBody)
                .expect(HttpStatus.NO_CONTENT)

            const found = (await mongoTestHelper.getProgramModel().findOne()) as ProgramDocument
            expect(found.state).toEqual(ProgramState.published)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const program = await mongoTestHelper.createProgram([])

            await request(app.getHttpServer())
                .put(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE /api/programs/managers/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram([])

            await request(app.getHttpServer())
                .delete(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const found = await mongoTestHelper.getProgramModel().findOne()
            expect(found).toBeNull()
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const program = await mongoTestHelper.createProgram([])

            await request(app.getHttpServer())
                .delete(`/api/programs/managers/${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
