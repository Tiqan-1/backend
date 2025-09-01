import { HttpStatus, INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { AuthenticationService } from '../src/features/authentication/authentication.service'
import { AuthenticationResponseDto } from '../src/features/authentication/dto/authentication-response.dto'
import { JwtStrategy } from '../src/features/authentication/strategies/jwt.strategy'
import { LessonsRepository } from '../src/features/lessons/lessons.repository'
import { LessonsService } from '../src/features/lessons/lessons.service'
import { LevelsRepository } from '../src/features/levels/levels.repository'
import { LevelsService } from '../src/features/levels/levels.service'
import { SignUpManagerDto } from '../src/features/managers/dto/manager.dto'
import { ManagersController } from '../src/features/managers/managers.controller'
import { ManagersRepository } from '../src/features/managers/managers.repository'
import { ManagersService } from '../src/features/managers/managers.service'
import { ProgramsRepository } from '../src/features/programs/programs.repository'
import { ProgramsService } from '../src/features/programs/programs.service'
import { ProgramsThumbnailsRepository } from '../src/features/programs/programs.thumbnails.repository'
import { SubjectsRepository } from '../src/features/subjects/subjects.repository'
import { SubjectsService } from '../src/features/subjects/subjects.service'
import { TasksRepository } from '../src/features/tasks/tasks.repository'
import { TasksService } from '../src/features/tasks/tasks.service'
import { TokensRepository } from '../src/features/tokens/tokens.repository'
import { TokensService } from '../src/features/tokens/tokens.service'
import { UsersRepository } from '../src/features/users/users.repository'
import { UsersService } from '../src/features/users/users.service'
import { SharedDocumentsService } from '../src/shared/database-services/shared-documents.service'
import { ConfigServiceProvider, JwtMockModule } from '../src/shared/test/helper/jwt-authentication-test.helper'
import { MongoTestHelper } from '../src/shared/test/helper/mongo-test.helper'
import { ChatService } from '../src/features/chat/chat.service'
import { ChatRepository } from '../src/features/chat/chat.repository'
import { MessageRepository } from '../src/features/chat/message.repository'
import { I18nService } from 'nestjs-i18n'
import { PusherService } from 'nestjs-pusher'

describe('ManagersController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            imports: [JwtMockModule],
            controllers: [ManagersController],
            providers: [
                ManagersService,
                ManagersRepository,
                AuthenticationService,
                UsersService,
                UsersRepository,
                TokensService,
                TokensRepository,
                SubjectsService,
                SubjectsRepository,
                LessonsService,
                LessonsRepository,
                ProgramsService,
                ProgramsRepository,
                ProgramsThumbnailsRepository,
                LevelsService,
                LevelsRepository,
                ChatService,
                ChatRepository,
                MessageRepository,
                { provide: I18nService, useValue: { t: vi.fn() } },
                { provide: PusherService, useValue: { trigger: vi.fn() } },
                TasksService,
                TasksRepository,
                SharedDocumentsService,
                JwtStrategy,
                ConfigServiceProvider,
                ...mongoTestHelper.providers,
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

    it('POST /api/managers/sign-up', async () => {
        const user: SignUpManagerDto = { name: 'test user', email: 'testUser@gmail.com', password: 'testPassword' }
        const expectedResult = { name: 'test user', email: 'testUser@gmail.com' }

        const response = await request(app.getHttpServer()).post('/api/managers/sign-up').send(user).expect(HttpStatus.CREATED)
        expect(response).toBeDefined()
        const body = response.body as AuthenticationResponseDto
        expect(body.name).toEqual(expectedResult.name)
        expect(body.email).toEqual(expectedResult.email)
    })
})
