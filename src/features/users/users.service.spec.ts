import { Test, TestingModule } from '@nestjs/testing'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

const usersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
}

describe('UsersService', () => {
    let service: UsersService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService, UsersRepository],
        })
            .overrideProvider(UsersRepository)
            .useValue(usersRepository)
            .compile()

        service = module.get<UsersService>(UsersService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
