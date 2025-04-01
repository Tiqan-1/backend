import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { SubscriptionDto, UpdateSubscriptionDto } from '../src/features/subscriptions/dto/subscription.dto'
import { State } from '../src/features/subscriptions/enums/state.enum'
import { SubscriptionDocument } from '../src/features/subscriptions/schemas/subscription.schema'
import { SubscriptionsController } from '../src/features/subscriptions/subscriptions.controller'
import { SubscriptionsRepository } from '../src/features/subscriptions/subscriptions.repository'
import { SubscriptionsService } from '../src/features/subscriptions/subscriptions.service'
import { SharedDocumentsService } from '../src/shared/documents-validator/shared-documents.service'
import {
    ConfigServiceProvider,
    JwtMockModule,
    mockJwtStrategyValidation,
} from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'

describe('SubscriptionsController (e2e)', () => {
    let app: INestApplication<App>
    let jwtService: JwtService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [SubscriptionsController],
            providers: [
                SubscriptionsService,
                SubscriptionsRepository,
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

    describe('GET api/subscriptions', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)
            const student = await mongoTestHelper.createStudent([])
            const subscription1 = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            const subscription2 = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const response = await request(app.getHttpServer())
                .get('/api/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeTruthy()
            const body = response.body as SubscriptionDto[]
            expect(body.length).toEqual(2)
            const ids = body.map(item => item.id)
            expect(ids).toContain(subscription1._id.toString())
            expect(ids).toContain(subscription2._id.toString())
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get('/api/subscriptions')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('GET api/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)
            const student = await mongoTestHelper.createStudent([])
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const response = await request(app.getHttpServer())
                .get(`/api/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeTruthy()
            const body = response.body as SubscriptionDto
            expect(body.id).toEqual(subscription._id.toString())
            expect(body.subscriber?.name).toEqual(student.name)
            expect(body.subscriber?.email).toEqual(student.email)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get(`/api/subscriptions/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT api/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)
            const student = await mongoTestHelper.createStudent([])
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const body: UpdateSubscriptionDto = {
                state: State.failed,
                notes: 'updated notes',
            }

            await request(app.getHttpServer())
                .put(`/api/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(updated.state).toEqual(State.failed)
            expect(updated.notes).toEqual('updated notes')
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const body: UpdateSubscriptionDto = {
                state: State.failed,
            }
            await request(app.getHttpServer())
                .put(`/api/subscriptions/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('DELETE api/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const level = await mongoTestHelper.createLevel([])
            const program = await mongoTestHelper.createProgram([level._id], manager._id)
            const student = await mongoTestHelper.createStudent([])
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            await request(app.getHttpServer())
                .delete(`/api/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deleted = await mongoTestHelper.getSubscriptionModel().findOne()
            expect(deleted).toBeFalsy()
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .delete(`/api/subscriptions/anyId`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
