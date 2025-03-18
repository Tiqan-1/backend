import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { ManagerDto, SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'
import { ManagersService } from './managers.service'
import { Manager } from './schemas/manager.schema'

describe('ManagersService', () => {
    let service: ManagersService
    let mongoTestHelper: MongoTestHelper
    let managerModel: Model<Manager>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        managerModel = mongoTestHelper.getManagerModel()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ManagersService,
                ManagersRepository,
                {
                    provide: getModelToken(Manager.name),
                    useValue: managerModel,
                },
            ],
        }).compile()

        service = module.get<ManagersService>(ManagersService)
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should create manager', async () => {
        const managerDto: SignUpManagerDto = {
            name: 'test manager',
            password: 'test password',
            email: 'manager@email.com',
        }

        const expected: ManagerDto = {
            name: 'test manager',
            email: 'manager@email.com',
            programs: [],
            subjects: [],
        }

        const result = await service.create(managerDto)

        expect(result).toEqual(expected)

        const savedManager = await managerModel.findOne()
        expect(savedManager?.password).toBeDefined()
        expect(savedManager?.password).not.toEqual('test password')
    })
})
