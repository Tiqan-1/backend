import { HttpStatus, INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Role } from '../src/features/authentication/enums/role.enum'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { CreateLessonDto, LessonDto } from '../src/features/lessons/dto/lesson.dto'
import { LessonType } from '../src/features/lessons/enums/lesson-type.enum'
import { LessonsController } from '../src/features/lessons/lessons.controller'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { Lesson } from '../src/features/lessons/schemas/lesson.schema'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

const configService = { get: vi.fn().mockReturnValue('secret') }

describe('LessonsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper
    let lessonModel: Model<Lesson>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        lessonModel = mongoTestHelper.getLessonModel()
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'secret',
                    signOptions: { expiresIn: '1d' },
                }),
            ],
            controllers: [LessonsController],
            providers: [
                LessonsService,
                LessonsRepository,
                JwtService,
                JwtStrategy,
                { provide: getModelToken(Lesson.name), useValue: lessonModel },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile()

        jwtService = module.get(JwtService)

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

    describe('POST /api/lessons/', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const body: CreateLessonDto = {
                title: 'lesson test',
                type: LessonType.Pdf,
                url: 'url test',
            }

            const response = await request(app.getHttpServer())
                .post('/api/lessons')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.CREATED)

            expect(response.body).toBeDefined()
            const { id, ...params } = response.body as LessonDto
            expect(id).toBeDefined()
            expect(params).toEqual(body)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: Role.Student })
            const body: CreateLessonDto = {
                title: 'lesson test',
                type: LessonType.Pdf,
                url: 'url test',
            }

            await request(app.getHttpServer())
                .post('/api/lessons')
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
