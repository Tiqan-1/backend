import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { ManagersRepository } from '../managers/managers.repository'
import { ManagersService } from '../managers/managers.service'
import { Manager } from '../managers/schemas/manager.schema'
import { ProgramsRepository } from './programs.repository'
import { ProgramsService } from './programs.service'
import { Program } from './schemas/program.schema'

describe('ProgramsService', () => {
    let service: ProgramsService
    let mongoTestHelper: MongoTestHelper

    beforeEach(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgramsService,
                ProgramsRepository,
                ManagersService,
                ManagersRepository,
                { provide: getModelToken(Program.name), useValue: mongoTestHelper.getProgramModel() },
                { provide: getModelToken(Manager.name), useValue: mongoTestHelper.getManagerModel() },
            ],
        }).compile()

        service = module.get<ProgramsService>(ProgramsService)
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
