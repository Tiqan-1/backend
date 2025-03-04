import { JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Test, TestingModule } from '@nestjs/testing'
import { TokensRepository } from '../tokens/tokens.repository'
import { TokensService } from '../tokens/tokens.service'
import { UsersRepository } from '../users/users.repository'
import { UsersService } from '../users/users.service'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService } from './authentication.service'

const jwtService = {
    sign: () => {},
}

const usersRepository = {
    create: () => {},
    findOne: () => {},
}

const tokensRepository = {
    create: () => {},
    findOne: () => {},
    remove: () => {},
}

describe('AuthenticationController', () => {
    let controller: AuthenticationController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [PassportModule],
            controllers: [AuthenticationController],
            providers: [AuthenticationService, JwtService, TokensService, TokensRepository, UsersService, UsersRepository],
        })
            .overrideProvider(TokensRepository)
            .useValue(tokensRepository)
            .overrideProvider(UsersRepository)
            .useValue(usersRepository)
            .overrideProvider(JwtService)
            .useValue(jwtService)
            .compile()

        controller = module.get<AuthenticationController>(AuthenticationController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
