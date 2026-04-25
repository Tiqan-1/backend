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
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelDocument } from '../src/features/levels/schemas/level.schema'
import { PaginatedTaskDto } from '../src/features/tasks/dto/paginated-task.dto'
import { CreateTaskDto, UpdateTaskDto } from '../src/features/tasks/dto/task.dto'
import { TaskState, TaskType } from '../src/features/tasks/enums'
import { TaskDocument } from '../src/features/tasks/schemas/task.schema'
import { TasksController } from '../src/features/tasks/tasks.controller'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { CreatedDto } from '../src/shared/dto/created.dto'
import { ObjectId } from '../src/shared/repository/types'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'
import { SubscriptionsService } from '../src/features/subscriptions/subscriptions.service'
import { SubscriptionsRepository } from '../src/features/subscriptions/subscriptions.repository'
import { CompleteTaskDto } from '../src/features/tasks/dto/complete-task.dto'

describe('TasksController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper
    const pusherMock = { trigger: vi.fn() }

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [TasksController],
            providers: [
                ChatService,
                ChatRepository,
                MessageRepository,
                { provide: I18nService, useValue: { t: vi.fn() } },
                { provide: PusherService, useValue: pusherMock },
                AssignmentsRepository,
                TasksService,
                TasksRepository,
                LessonsService,
                LessonsRepository,
                SubscriptionsService,
                SubscriptionsRepository,
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
        pusherMock.trigger.mockClear()
    })

    describe('POST /api/tasks', () => {
        it('should succeed creating task with type lesson', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id)

            const body: CreateTaskDto = {
                levelId: level._id,
                date: new Date(),
                type: TaskType.lesson,
                lessonIds: [lesson._id],
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
            expect(created.date).toEqual(body.date)
            expect(created.lessons).toEqual([lesson._id.toString()])

            const updated = (await mongoTestHelper.getLevelModel().findOne()) as LevelDocument
            expect(updated).toBeDefined()
            expect(updated.tasks.length).toEqual(1)
        })

        it('should succeed creating task with type lesson', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const assignment = await mongoTestHelper.createAssignment(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id)

            const body: CreateTaskDto = {
                levelId: level._id,
                date: new Date(),
                type: TaskType.assignment,
                assignmentId: assignment.id.toString(),
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
            expect(created.date).toEqual(body.date)
            expect(created.assignment).toEqual(assignment._id.toString())
        })

        it('should succeed creating task with type meeting', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel(manager._id)

            const body: CreateTaskDto = {
                levelId: level._id,
                date: new Date(),
                type: TaskType.meeting,
                meetingLink: 'https://youtube.com/live',
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
            expect(created.date).toEqual(body.date)
            expect(created.meetingLink).toEqual(body.meetingLink)
        })

        it('should succeed creating task with type wird', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel(manager._id)

            const body: CreateTaskDto = {
                levelId: level._id,
                date: new Date(),
                type: TaskType.wird,
                wirdTitle: 'wirdTitle',
                wirdDetails: 'wirdDetails',
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
            expect(created.date).toEqual(body.date)
            expect(created.wirdTitle).toEqual(body.wirdTitle)
            expect(created.wirdDetails).toEqual(body.wirdDetails)
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
                    hasChatRoom: false,
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                    type: 'lesson',
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
                    hasChatRoom: false,
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                    type: 'lesson',
                },
            ]

            const response = await request(app.getHttpServer())
                .get(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedTaskDto
            expect(body.items).toEqual(expected)
        })

        it('should not return deleted tasks', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            task.state = TaskState.deleted
            await task.save()
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const response = await request(app.getHttpServer())
                .get(`/api/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            const body = response.body as PaginatedTaskDto
            expect(body.items).to.have.lengthOf(0)
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
                    hasChatRoom: false,
                    lessons: [
                        {
                            id: lesson._id.toString(),
                            title: lesson.title,
                            type: lesson.type,
                            url: lesson.url,
                        },
                    ],
                    type: 'lesson',
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

    describe('Put /api/tasks/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const token = jwtService.sign({ id: manager._id, role: manager.role })

            const newLesson = await mongoTestHelper.createLesson(manager._id)
            const body = {
                date: '2025-10-08T22:00:00.000Z',
                lessonIds: [newLesson._id.toString()],
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = await mongoTestHelper.getTaskModel().findById(task._id)

            expect(updated).toBeDefined()
            const expectedDate = '2025-10-08T22:00:00.000Z'
            expect(updated?.date.toISOString()).toEqual(expectedDate)
            expect(updated?.lessons).toEqual([newLesson._id.toString()])
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
                lessonIds: [newLesson._id],
            }

            await request(app.getHttpServer())
                .put(`/api/tasks/${task._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = await mongoTestHelper.getTaskModel().findById(task._id)

            expect(updated).toBeDefined()
            expect(updated?.date).toEqual(task.date)
            expect(updated?.lessons).toEqual([newLesson._id.toString()])
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

    describe('POST /api/tasks/:taskId/complete', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const lesson = await mongoTestHelper.createLesson(manager._id)
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()

            const task = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            const task2 = await mongoTestHelper.createTask(manager._id, level._id, [lesson._id])
            level.tasks = [task._id, task2._id]
            await level.save()

            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            ;(student.subscriptions as ObjectId[]).push(subscription._id)
            await student.save()
            const token = jwtService.sign({ id: student._id, role: student.role })

            const body: CompleteTaskDto = {
                subscriptionId: subscription._id,
            }

            await request(app.getHttpServer())
                .post(`/api/tasks/${task._id.toString()}/complete`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)


            const found = await mongoTestHelper.getSubscriptionModel().findById(subscription._id)
            expect(found?.completedTaskIds[0].toString()).toEqual(task._id.toString())
            expect(found?.progressPercentage).toEqual(50)
        })
    })

    describe('OralTest', () => {
        const slot = (offsetMinutes: number, duration = 30) => ({
            startsAt: new Date(Date.now() + offsetMinutes * 60_000),
            durationMinutes: duration,
        })

        const seedSubscribedStudent = async (
            program: { _id: ObjectId; levels: ObjectId[]; save: () => Promise<unknown> },
            level: { _id: ObjectId },
            studentSuffix = ''
        ) => {
            const student = await mongoTestHelper.createStudent(studentSuffix)
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            ;(student.subscriptions as ObjectId[]).push(subscription._id)
            await student.save()
            return { student, subscription }
        }

        describe('POST /api/tasks (oralTest)', () => {
            it('should succeed creating an oralTest with initial slots', async () => {
                const manager = await mongoTestHelper.createManager()
                const token = jwtService.sign({ id: manager._id, role: manager.role })
                const level = await mongoTestHelper.createLevel(manager._id)

                const body: CreateTaskDto = {
                    levelId: level._id,
                    date: new Date(),
                    type: TaskType.oralTest,
                    title: 'تسميع البقرة 1-50',
                    description: 'وصف',
                    meetingLink: 'https://meet.example.com/oral',
                    initialSlots: [slot(60), slot(120)],
                }

                const response = await request(app.getHttpServer())
                    .post(`/api/tasks`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(body)
                    .expect(HttpStatus.CREATED)

                const { id } = response.body as CreatedDto
                expect(id).toBeDefined()

                const created = (await mongoTestHelper.getTaskModel().findById(id)) as TaskDocument & {
                    type: string
                    title: string
                    slots: { _id: ObjectId; bookedBy?: ObjectId }[]
                }
                expect(created.type).toEqual(TaskType.oralTest)
                expect(created.title).toEqual(body.title)
                expect(created.slots).toHaveLength(2)
                expect(created.slots.every(s => !s.bookedBy)).toBe(true)
            })

            it('should fail with 406 when title is missing', async () => {
                const manager = await mongoTestHelper.createManager()
                const token = jwtService.sign({ id: manager._id, role: manager.role })
                const level = await mongoTestHelper.createLevel(manager._id)

                const body: CreateTaskDto = {
                    levelId: level._id,
                    date: new Date(),
                    type: TaskType.oralTest,
                }

                await request(app.getHttpServer())
                    .post(`/api/tasks`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(body)
                    .expect(HttpStatus.NOT_ACCEPTABLE)
            })
        })

        describe('PUT /api/tasks/:id/slots', () => {
            it('should replace slots when none are booked', async () => {
                const manager = await mongoTestHelper.createManager()
                const token = jwtService.sign({ id: manager._id, role: manager.role })
                const level = await mongoTestHelper.createLevel(manager._id)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])

                await request(app.getHttpServer())
                    .put(`/api/tasks/${task._id.toString()}/slots`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ slots: [slot(180), slot(240)] })
                    .expect(HttpStatus.NO_CONTENT)

                const reloaded = (await mongoTestHelper.getTaskModel().findById(task._id)) as TaskDocument & {
                    slots: { _id: ObjectId }[]
                }
                expect(reloaded.slots).toHaveLength(2)
            })

            it('should fail with 409 when at least one slot is booked', async () => {
                const manager = await mongoTestHelper.createManager()
                const token = jwtService.sign({ id: manager._id, role: manager.role })
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date() },
                ])

                await request(app.getHttpServer())
                    .put(`/api/tasks/${task._id.toString()}/slots`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ slots: [slot(120)] })
                    .expect(HttpStatus.CONFLICT)
            })
        })

        describe('GET /api/tasks/:id/slots', () => {
            it('should hide bookedBy when called by a student', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date() },
                ])
                const studentToken = jwtService.sign({ id: student._id, role: student.role })

                const response = await request(app.getHttpServer())
                    .get(`/api/tasks/${task._id.toString()}/slots`)
                    .set('Authorization', `Bearer ${studentToken}`)
                    .expect(HttpStatus.OK)

                const slots = response.body as { booked: boolean; bookedBy?: string }[]
                expect(slots).toHaveLength(1)
                expect(slots[0].booked).toBe(true)
                expect(slots[0].bookedBy).toBeUndefined()
            })

            it('should expose bookedBy when called by the owner manager', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date() },
                ])
                const managerToken = jwtService.sign({ id: manager._id, role: manager.role })

                const response = await request(app.getHttpServer())
                    .get(`/api/tasks/${task._id.toString()}/slots`)
                    .set('Authorization', `Bearer ${managerToken}`)
                    .expect(HttpStatus.OK)

                const slots = response.body as { booked: boolean; bookedBy?: string }[]
                expect(slots[0].bookedBy).toEqual(student._id.toString())
            })
        })

        describe('POST /api/tasks/:id/slots/:slotId/book', () => {
            it('should book successfully and notify via Pusher', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: student._id, role: student.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/book`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ subscriptionId: subscription._id })
                    .expect(HttpStatus.NO_CONTENT)

                const reloaded = (await mongoTestHelper.getTaskModel().findById(task._id)) as TaskDocument & {
                    slots: { _id: ObjectId; bookedBy?: ObjectId; bookedSubscriptionId?: ObjectId }[]
                }
                expect(reloaded.slots[0].bookedBy?.toString()).toEqual(student._id.toString())
                expect(reloaded.slots[0].bookedSubscriptionId?.toString()).toEqual(subscription._id.toString())
                expect(pusherMock.trigger).toHaveBeenCalledWith(
                    `oral-test-${task._id.toString()}`,
                    'slot-booked',
                    expect.objectContaining({ slotId: slotId.toString(), studentId: student._id.toString() })
                )
            })

            it('should prevent double booking under concurrent requests', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student: studentA, subscription: subA } = await seedSubscribedStudent(program, level, 'A')
                const { student: studentB, subscription: subB } = await seedSubscribedStudent(program, level, 'B')
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])
                const slotId = task.slots[0]._id
                const tokenA = jwtService.sign({ id: studentA._id, role: studentA.role })
                const tokenB = jwtService.sign({ id: studentB._id, role: studentB.role })

                const [resA, resB] = await Promise.all([
                    request(app.getHttpServer())
                        .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/book`)
                        .set('Authorization', `Bearer ${tokenA}`)
                        .send({ subscriptionId: subA._id }),
                    request(app.getHttpServer())
                        .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/book`)
                        .set('Authorization', `Bearer ${tokenB}`)
                        .send({ subscriptionId: subB._id }),
                ])
                const statuses = [resA.status, resB.status].sort()
                expect(statuses).toEqual([HttpStatus.NO_CONTENT, HttpStatus.CONFLICT])
            })

            it('should fail with 404 when subscription does not belong to student', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const otherStudent = await mongoTestHelper.createStudent('other')
                const otherSub = await mongoTestHelper.createSubscription(program._id, level._id, otherStudent._id)
                const myStudent = await mongoTestHelper.createStudent('mine')
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: myStudent._id, role: myStudent.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/book`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ subscriptionId: otherSub._id })
                    .expect(HttpStatus.NOT_FOUND)
            })

            it('should fail with 406 when task level is not in subscription program', async () => {
                const manager = await mongoTestHelper.createManager()
                const programA = await mongoTestHelper.createProgram(manager._id)
                const levelA = await mongoTestHelper.createLevel(manager._id, programA._id)
                programA.levels = [levelA._id]
                await programA.save()
                const programB = await mongoTestHelper.createProgram(manager._id)
                const levelB = await mongoTestHelper.createLevel(manager._id, programB._id)
                programB.levels = [levelB._id]
                await programB.save()
                const { student, subscription } = await seedSubscribedStudent(programA, levelA)
                const task = await mongoTestHelper.createOralTestTask(manager._id, levelB._id, [slot(60)])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: student._id, role: student.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/book`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ subscriptionId: subscription._id })
                    .expect(HttpStatus.NOT_ACCEPTABLE)
            })
        })

        describe('DELETE /api/tasks/:id/slots/:slotId/booking', () => {
            it('should fail with 404 for a non-owner manager', async () => {
                const owner = await mongoTestHelper.createManager()
                const stranger = await mongoTestHelper.createManager('stranger')
                const program = await mongoTestHelper.createProgram(owner._id)
                const level = await mongoTestHelper.createLevel(owner._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(owner._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date() },
                ])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: stranger._id, role: stranger.role })

                await request(app.getHttpServer())
                    .delete(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/booking`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ reason: 'no show' })
                    .expect(HttpStatus.NOT_FOUND)
            })

            it('should release the slot, audit-stamp, and notify the student', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date(), bookedSubscriptionId: subscription._id },
                ])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: manager._id, role: manager.role })

                await request(app.getHttpServer())
                    .delete(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/booking`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ reason: 'rescheduled' })
                    .expect(HttpStatus.NO_CONTENT)

                const reloaded = (await mongoTestHelper.getTaskModel().findById(task._id)) as TaskDocument & {
                    slots: {
                        _id: ObjectId
                        bookedBy?: ObjectId
                        cancelledBy?: ObjectId
                        cancellationReason?: string
                    }[]
                }
                expect(reloaded.slots[0].bookedBy).toBeUndefined()
                expect(reloaded.slots[0].cancelledBy?.toString()).toEqual(manager._id.toString())
                expect(reloaded.slots[0].cancellationReason).toEqual('rescheduled')
                expect(pusherMock.trigger).toHaveBeenCalledWith(
                    `student-${student._id.toString()}`,
                    'oral-test-booking-cancelled',
                    expect.objectContaining({ taskId: task._id.toString(), slotId: slotId.toString() })
                )
            })
        })

        describe('POST /api/tasks/:id/slots/:slotId/grade', () => {
            it('should set grade, mark task completed, and notify student', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date(), bookedSubscriptionId: subscription._id },
                ])
                const task2 = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(120)])
                level.tasks = [task._id, task2._id]
                await level.save()
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: manager._id, role: manager.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/grade`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ grade: 95, feedback: 'ممتاز' })
                    .expect(HttpStatus.NO_CONTENT)

                const sub = await mongoTestHelper.getSubscriptionModel().findById(subscription._id)
                expect(sub?.completedTaskIds.map(id => id.toString())).toContain(task._id.toString())
                expect(sub?.progressPercentage).toEqual(50)
                expect(pusherMock.trigger).toHaveBeenCalledWith(
                    `student-${student._id.toString()}`,
                    'oral-test-graded',
                    expect.objectContaining({ taskId: task._id.toString(), grade: 95 })
                )
            })

            it('should fail with 409 when grading an unbooked slot', async () => {
                const manager = await mongoTestHelper.createManager()
                const level = await mongoTestHelper.createLevel(manager._id)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: manager._id, role: manager.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/grade`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ grade: 80 })
                    .expect(HttpStatus.CONFLICT)
            })

            it('should fail with 404 when called by a non-owner manager', async () => {
                const owner = await mongoTestHelper.createManager()
                const stranger = await mongoTestHelper.createManager('stranger')
                const program = await mongoTestHelper.createProgram(owner._id)
                const level = await mongoTestHelper.createLevel(owner._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(owner._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date(), bookedSubscriptionId: subscription._id },
                ])
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: stranger._id, role: stranger.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/grade`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ grade: 80 })
                    .expect(HttpStatus.NOT_FOUND)
            })

            it('should not double-credit completion on re-grade', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date(), bookedSubscriptionId: subscription._id },
                ])
                level.tasks = [task._id]
                await level.save()
                const slotId = task.slots[0]._id
                const token = jwtService.sign({ id: manager._id, role: manager.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/grade`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ grade: 80 })
                    .expect(HttpStatus.NO_CONTENT)
                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/slots/${slotId.toString()}/grade`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ grade: 90 })
                    .expect(HttpStatus.NO_CONTENT)

                const sub = await mongoTestHelper.getSubscriptionModel().findById(subscription._id)
                expect(sub?.completedTaskIds.filter(id => id.equals(task._id))).toHaveLength(1)
            })
        })

        describe('POST /api/tasks/:id/complete on oralTest', () => {
            it('should reject student self-completion with 406', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student, subscription } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [slot(60)])
                const token = jwtService.sign({ id: student._id, role: student.role })

                await request(app.getHttpServer())
                    .post(`/api/tasks/${task._id.toString()}/complete`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ subscriptionId: subscription._id })
                    .expect(HttpStatus.NOT_ACCEPTABLE)
            })
        })

        describe('GET /api/tasks/:id/bookings', () => {
            it('should return hydrated student data per booked slot', async () => {
                const manager = await mongoTestHelper.createManager()
                const program = await mongoTestHelper.createProgram(manager._id)
                const level = await mongoTestHelper.createLevel(manager._id, program._id)
                program.levels = [level._id]
                await program.save()
                const { student } = await seedSubscribedStudent(program, level)
                const task = await mongoTestHelper.createOralTestTask(manager._id, level._id, [
                    { ...slot(60), bookedBy: student._id, bookedAt: new Date() },
                    slot(120),
                ])
                const token = jwtService.sign({ id: manager._id, role: manager.role })

                const response = await request(app.getHttpServer())
                    .get(`/api/tasks/${task._id.toString()}/bookings`)
                    .set('Authorization', `Bearer ${token}`)
                    .expect(HttpStatus.OK)

                const bookings = response.body as { student: { id: string; email: string } }[]
                expect(bookings).toHaveLength(1)
                expect(bookings[0].student.id).toEqual(student._id.toString())
                expect(bookings[0].student.email).toEqual(student.email)
            })
        })
    })
})
