import { HttpStatus, INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { SubscriptionDto } from '../src/features/subscriptions/dto/subscription.dto'
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
            const program = await mongoTestHelper.createProgram([level._id])
            const subscription1 = await mongoTestHelper.createSubscription(program._id, level._id)
            const subscription2 = await mongoTestHelper.createSubscription(program._id, level._id)

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
})
