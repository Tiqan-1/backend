import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { ObjectId } from 'src/shared/repository/types'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { PaginatedSubscriptionDto } from '../src/features/subscriptions/dto/paginated-subscripition.dto'
import { UpdateSubscriptionDto } from '../src/features/subscriptions/dto/subscription.dto'
import { SubscriptionState } from '../src/features/subscriptions/enums/subscription-state.enum'
import { SubscriptionDocument } from '../src/features/subscriptions/schemas/subscription.schema'
import { SubscriptionsController } from '../src/features/subscriptions/subscriptions.controller'
import { SubscriptionsRepository } from '../src/features/subscriptions/subscriptions.repository'
import { SubscriptionsService } from '../src/features/subscriptions/subscriptions.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
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

    describe('GET api/subscriptions/v2', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription1 = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            const subscription2 = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const response = await request(app.getHttpServer())
                .get('/api/subscriptions/v2')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeTruthy()
            const body = response.body as PaginatedSubscriptionDto
            expect(body.items.length).toEqual(2)
            const ids = body.items.map(item => item.id)
            expect(ids).toContain(subscription1._id.toString())
            expect(ids).toContain(subscription2._id.toString())

            // test populated fields
            const firstSubscription = body.items[0]
            expect(firstSubscription.subscriber?.name).toEqual(student.name)
            expect(firstSubscription.program?.name).toEqual(program.name)
            expect(firstSubscription.program?.createdBy.name).toEqual(manager.name)
            expect(firstSubscription.level?.name).toEqual(level.name)
            expect(firstSubscription.level?.createdBy.name).toEqual(manager.name)
        })

        it('should only return subscriptions found by query', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const program2 = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription1 = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            await mongoTestHelper.createSubscription(program2._id, level._id, student._id)

            const response = await request(app.getHttpServer())
                .get(`/api/subscriptions/v2?programId=${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeTruthy()
            const body = response.body as PaginatedSubscriptionDto
            expect(body.items.length).toEqual(1)
            const ids = body.items.map(item => item.id)
            expect(ids).toContain(subscription1._id.toString())
        })

        it('should only return subscriptions of programs created by the current manager', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const manager2 = await mongoTestHelper.createManager('2')
            const program = await mongoTestHelper.createProgram(manager2._id)
            const level = await mongoTestHelper.createLevel(manager2._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const response = await request(app.getHttpServer())
                .get(`/api/subscriptions/v2?programId=${program._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.OK)

            expect(response.body).toBeTruthy()
            const body = response.body as PaginatedSubscriptionDto
            expect(body.items.length).toEqual(0)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .get('/api/subscriptions/v2')
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })

    describe('PUT api/subscriptions/:id', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            const body: UpdateSubscriptionDto = {
                state: SubscriptionState.failed,
                notes: 'updated notes',
            }

            await request(app.getHttpServer())
                .put(`/api/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .send(body)
                .expect(HttpStatus.NO_CONTENT)

            const updated = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(updated.state).toEqual(SubscriptionState.failed)
            expect(updated.notes).toEqual('updated notes')
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })
            const body: UpdateSubscriptionDto = {
                state: SubscriptionState.failed,
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
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)

            await request(app.getHttpServer())
                .delete(`/api/subscriptions/${subscription._id.toString()}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const deleted = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(deleted.state).toEqual(SubscriptionState.deleted)
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

    describe('PUT api/subscriptions/:id/approve', () => {
        it('should succeed', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            subscription.state = SubscriptionState.pending
            await subscription.save()

            await request(app.getHttpServer())
                .put(`/api/subscriptions/${subscription._id.toString()}/approve`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NO_CONTENT)

            const approved = (await mongoTestHelper.getSubscriptionModel().findOne()) as SubscriptionDocument
            expect(approved.state).toEqual(SubscriptionState.active)
        })

        it('should fail with 406 if subscription not owned by callee', async () => {
            const manager = await mongoTestHelper.createManager()
            const manager1 = await mongoTestHelper.createManager('1')
            const token = jwtService.sign({ id: manager1._id, role: manager1.role })
            const program = await mongoTestHelper.createProgram(manager._id)
            const level = await mongoTestHelper.createLevel(manager._id, program._id)
            program.levels = [level._id]
            await program.save()
            const student = await mongoTestHelper.createStudent()
            const subscription = await mongoTestHelper.createSubscription(program._id, level._id, student._id)
            subscription.state = SubscriptionState.pending
            await subscription.save()

            await request(app.getHttpServer())
                .put(`/api/subscriptions/${subscription._id.toString()}/approve`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_ACCEPTABLE)
        })

        it('should fail with 404 if called with a wrong subscriptionId', async () => {
            const manager = await mongoTestHelper.createManager()
            const token = jwtService.sign({ id: manager._id, role: manager.role })
            const id = new ObjectId()

            await request(app.getHttpServer())
                .put(`/api/subscriptions/${id.toString()}/approve`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.NOT_FOUND)
        })

        it('should fail with 403 if called by a student', async () => {
            const student = await mongoTestHelper.createStudent()
            const token = jwtService.sign({ id: student._id, role: student.role })

            await request(app.getHttpServer())
                .put(`/api/subscriptions/anyId/approve`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN)
        })
    })
})
