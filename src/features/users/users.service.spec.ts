import { Test, TestingModule } from '@nestjs/testing'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

const usersRepository = {
    create: () => {},
    findAll: () => {},
    findOne: () => {},
    remove: () => {},
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
