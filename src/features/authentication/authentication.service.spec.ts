import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { TokensRepository } from '../tokens/tokens.repository'
import { TokensService } from '../tokens/tokens.service'
import { UsersRepository } from '../users/users.repository'
import { UsersService } from '../users/users.service'
import { AuthenticationService } from './authentication.service'

const jwtService = {
    sign: jest.fn(),
}

const usersRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
}

const tokensRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
}

describe('AuthenticationService', () => {
    let service: AuthenticationService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthenticationService, JwtService, TokensService, TokensRepository, UsersService, UsersRepository],
        })
            .overrideProvider(TokensRepository)
            .useValue(tokensRepository)
            .overrideProvider(UsersRepository)
            .useValue(usersRepository)
            .overrideProvider(JwtService)
            .useValue(jwtService)
            .compile()

        service = module.get(AuthenticationService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
