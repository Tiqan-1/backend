import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

const usersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
}

describe('UsersController', () => {
    let controller: UsersController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [UsersService, UsersRepository],
        })
            .overrideProvider(UsersRepository)
            .useValue(usersRepository)
            .compile()

        controller = module.get<UsersController>(UsersController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
