import { Test, TestingModule } from '@nestjs/testing'
import { TokensRepository } from './tokens.repository'
import { TokensService } from './tokens.service'

const tokensRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
}

describe('TokensService', () => {
    let service: TokensService

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TokensService, TokensRepository],
        })
            .overrideProvider(TokensRepository)
            .useValue(tokensRepository)
            .compile()

        service = module.get(TokensService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
