import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { User, UserSchema } from './schemas/user.schema'
import { UsersRepository } from './users.repository'

describe('UsersRepository', () => {
    let service: UsersRepository

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
                MongooseModule.forRoot(process.env.MONGODB_URI as string),
                MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
            ],
            providers: [UsersRepository],
        }).compile()

        service = module.get<UsersRepository>(UsersRepository)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
