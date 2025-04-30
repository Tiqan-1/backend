import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vitest } from 'vitest'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { AuthenticationResponseDto } from '../src/features/authentication/dto/authentication-response.dto'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { PaginatedProgramDto } from '../src/features/programs/dto/paginated-program.dto'
import { StudentProgramDto } from '../src/features/programs/dto/program.dto'
import { ProgramState } from '../src/features/programs/enums/program-state.enum'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { ProgramsThumbnailsRepository } from '../src/features/programs/programs.thumbnails.repository'
import { SignUpStudentDto } from '../src/features/students/dto/student.dto'
import { Gender } from '../src/features/students/enums/gender'
import { StudentStatus } from '../src/features/students/enums/student-status'
import { StudentDocument } from '../src/features/students/schemas/student.schema'
import { StudentsController } from '../src/features/students/students.controller'
import { StudentRepository } from '../src/features/students/students.repository'
import { StudentsService } from '../src/features/students/students.service'
import { SubjectsRepository } from '../src/features/subjects/subjects.repository'
import { SubjectsService } from '../src/features/subjects/subjects.service'
import { PaginatedStudentSubscriptionDto } from '../src/features/subscriptions/dto/paginated-subscripition.dto'
import { CreateSubscriptionDto, StudentSubscriptionDto } from '../src/features/subscriptions/dto/subscription.dto'
import { SubscriptionState } from '../src/features/subscriptions/enums/subscription-state.enum'
import { SubscriptionDocument } from '../src/features/subscriptions/schemas/subscription.schema'
import { SubscriptionsRepository } from '../src/features/subscriptions/subscriptions.repository'
import { SubscriptionsService } from '../src/features/subscriptions/subscriptions.service'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('StudentsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [StudentsController],
            providers: [
                StudentsService,
                StudentRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                SubjectsService,
                SubjectsRepository,
                SubscriptionsService,
                SubscriptionsRepository,
                LessonsService,
                LessonsRepository,
                ProgramsService,
                ProgramsRepository,
                ProgramsThumbnailsRepository,
                LevelsService,
                LevelsRepository,
                TasksService,
                TasksRepository,
                JwtStrategy,
                SharedDocumentsService,
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

    describe('POST /api/students/sign-up', () => {
        it('should succeed', async () => {
            const user: SignUpStudentDto = {
                name: 'test user',
                email: 'testUser@gmail.com',
                gender: Gender.male,
                password: 'P@ssw0rd',
            }
            const expectedResult: AuthenticationResponseDto = {
                name: 'test user',
                email: 'testUser@gmail.com',
                accessToken: 'any',
                refreshToken: 'any',
            }
            const response = await request(app.getHttpServer())
                .post('/api/students/sign-up')
                .send(user)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const body = response.body as AuthenticationResponseDto
            expect(body.name).toBe(expectedResult.name)
            expect(body.email).toBe(expectedResult.email)
        })
    })

    describe('DELETE /api/students', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()

            await request(app.getHttpServer())
                .delete('/api/students')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deletedStudent = (await mongoTestHelper.getStudentModel().findOne()) as StudentDocument
            expect(deletedStudent.status).toEqual(StudentStatus.deleted)

            const deletedSubscription = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(deletedSubscription.state).toEqual(SubscriptionState.deleted)
        })
    })

    describe('POST /api/students/subscriptions/subscribe', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            const response = await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const { id } = response.body as CreatedDto

            const created = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(created).toBeTruthy()
            expect(id).toEqual(created._id.toString())
            expect(created.state).toEqual(SubscriptionState.active)
        })

        it('should fail with 406 if program is not published', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 406 if program registration start is in future', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 406 if program registration end is in past', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            program.registrationEnd = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 404 if level is not of the given program', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.state = ProgramState.published
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 409 if student already subscribed to same level in the same program', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription]
            await student.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions/subscribe')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CONFLICT)
        })
    })

    describe('POST /api/students/subscriptions', () => {
        it('should succeed', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            const response = await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const { id } = response.body as CreatedDto

            const created = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(created).toBeTruthy()
            expect(id).toEqual(created._id.toString())
            expect(created.state).toEqual(SubscriptionState.active)
        })

        it('should fail with 406 if program is not published', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 406 if program registration start is in future', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 406 if program registration end is in past', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            program.state = ProgramState.published
            program.registrationEnd = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 404 if level is not of the given program', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.state = ProgramState.published
            program.registrationStart = new Date()
            await program.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 409 if student already subscribed to same level in the same program', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription]
            await student.save()

            const body: CreateSubscriptionDto = {
                programId: program._id.toString(),
                levelId: level._id.toString(),
            }

            await request(app.getHttpServer())
                .post('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CONFLICT)
        })
    })

    describe('GET /api/students/subscriptions', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            const response = await request(app.getHttpServer())
                .get('/api/students/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const {
                id,
                level: levelDto,
                program: programDto,
                state,
                subscriptionDate,
            } = (response.body as StudentSubscriptionDto[])[0]
            expect(id).toEqual(subscription._id.toString())
            expect(programDto?.id).toEqual(program._id.toString())
            expect(programDto?.levelIds).toEqual([level._id.toString()])
            expect(levelDto?.id).toEqual(level._id.toString())
            expect(levelDto?.tasks[0].id).toEqual(task._id.toString())
            expect(levelDto?.tasks[0].lessons[0].id).toEqual(lesson._id.toString())
            expect(state).toEqual(subscription.state)
            expect(subscriptionDate).toEqual(subscription.subscriptionDate.toISOString())
        })
    })

    describe('GET /api/students/subscriptions/v2', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            const response = await request(app.getHttpServer())
                .get('/api/students/subscriptions/v2')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const body = response.body as PaginatedStudentSubscriptionDto
            const { id, level: levelDto, program: programDto, state, subscriptionDate } = body.items[0]
            expect(id).toEqual(subscription._id.toString())
            expect(programDto?.id).toEqual(program._id.toString())
            expect(programDto?.levelIds).toEqual([level._id.toString()])
            expect(levelDto?.id).toEqual(level._id.toString())
            expect(levelDto?.tasks[0].id).toEqual(task._id.toString())
            expect(levelDto?.tasks[0].lessons[0].id).toEqual(lesson._id.toString())
            expect(state).toEqual(subscription.state)
            expect(subscriptionDate).toEqual(subscription.subscriptionDate.toISOString())
        })

        it('should only return subscriptions of the current student', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            const student2 = await mongoTestHelper.createStudent('2')
            const subscription2 = await mongoTestHelper.createSubscription(program._id, level._id, student2._id)
            student2.subscriptions = [subscription2._id]
            await student2.save()

            const response = await request(app.getHttpServer())
                .get('/api/students/subscriptions/v2')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const body = response.body as PaginatedStudentSubscriptionDto
            expect(body.items.length).toEqual(1)
        })
    })

    describe('PUT /api/students/subscriptions/:id/suspend', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .put(`/api/students/subscriptions/${subscription._id.toString()}/suspend`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const { state } = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(state).toEqual(SubscriptionState.suspended)
        })
    })

    describe('DELETE /api/students/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            student.subscriptions = [subscription._id]
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/students/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const { state } = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(state).toEqual(SubscriptionState.deleted)

            const { subscriptions } = (await mongoTestHelper.getStudentModel().findOne()) as StudentDocument
            expect(subscriptions).toEqual([])
        })
    })

    describe('GET /api/students/open-programs', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()

            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(now.getDate() - 1)
            const tomorrow = new Date(now)
            tomorrow.setDate(now.getDate() + 1)
            program.registrationStart = yesterday
            program.registrationEnd = tomorrow
            program.state = ProgramState.published
            await program.save()

            vitest
                .spyOn(ProgramsThumbnailsRepository.prototype, 'findOne')
                .mockImplementation(thumbnail => Promise.resolve(`base64-${thumbnail}`))

            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            // unpublished program: should not be returned
            await mongoTestHelper.createProgram(manager._id)

            const response = await request(app.getHttpServer())
                .get('/api/students/open-programs')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const programs = response.body as StudentProgramDto[]
            expect(programs.length).toEqual(1)
            expect(programs[0].id).toEqual(program._id.toString())
            expect(programs[0].levels[0].name).toEqual(level.name)
            expect(programs[0].levels[0].tasks[0].date).toEqual(task.date.toISOString())
            expect(programs[0].levels[0].tasks[0].lessons[0].url).toEqual(lesson.url)
            expect(programs[0].thumbnail).toContain(`base64-`)
        })
    })

    describe('GET /api/students/open-programs/v2', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id]
            await level.save()
            program.levels = [level._id]
            await program.save()

            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(now.getDate() - 1)
            const tomorrow = new Date(now)
            tomorrow.setDate(now.getDate() + 1)
            program.registrationStart = yesterday
            program.registrationEnd = tomorrow
            program.state = ProgramState.published
            await program.save()

            vitest
                .spyOn(ProgramsThumbnailsRepository.prototype, 'findOne')
                .mockImplementation(thumbnail => Promise.resolve(`base64-${thumbnail}`))

            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            // unpublished program: should not be returned
            await mongoTestHelper.createProgram(manager._id)

            const response = await request(app.getHttpServer())
                .get('/api/students/open-programs/v2')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeDefined()
            const body = response.body as PaginatedProgramDto
            expect(body.items.length).toEqual(1)
            const programs = body.items as StudentProgramDto[]
            expect(programs[0].id).toEqual(program._id.toString())
            expect(programs[0].levels[0].name).toEqual(level.name)
            expect(programs[0].levels[0].tasks[0].date).toEqual(task.date.toISOString())
            expect(programs[0].levels[0].tasks[0].lessons[0].url).toEqual(lesson.url)
            expect(programs[0].thumbnail).toContain(`base64-`)
        })
    })
})
