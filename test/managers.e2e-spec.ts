import { HttpStatus, INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { SignUpManagerDto } from '../src/features/managers/dto/manager.dto'
import { ManagersController } from '../src/features/managers/managers.controller'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { Manager, ManagerSchema } from '../src/features/managers/schemas/manager.schema'
import { User, UserSchema } from '../src/features/users/schemas/user.schema'
import { MongoTestHelper } from '../src/shared/helper/mongo-test.helper'

describe('ManagersController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper
    let managerModel: Model<unknown>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const userModel = mongoTestHelper.initModel(User.name, UserSchema)
        managerModel = userModel.discriminator(Manager.name, ManagerSchema) as Model<unknown>

        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            controllers: [ManagersController],
            providers: [
                ManagersService,
                ManagersRepository,
                {
                    provide: getModelToken(Manager.name),
                    useValue: managerModel,
                },
            ],
        }).compile()

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

    it('POST /api/managers/sign-up', () => {
        const user: SignUpManagerDto = { name: 'test user', email: 'testUser@gmail.com', password: 'testPassword' }
        const expectedResult = { name: 'test user', email: 'testUser@gmail.com', programs: [] }
        return request(app.getHttpServer())
            .post('/api/managers/sign-up')
            .send(user)
            .expect(HttpStatus.CREATED)
            .expect(expectedResult)
    })
})
