import { HttpStatus, INestApplication } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { SignUpStudentDto, StudentDto } from '../src/features/students/dto/student.dto'
import { Gender } from '../src/features/students/enums/gender'
import { Student, StudentSchema } from '../src/features/students/schemas/student.schema'
import { StudentsController } from '../src/features/students/students.controller'
import { StudentRepository } from '../src/features/students/students.repository'
import { StudentsService } from '../src/features/students/students.service'
import { User, UserSchema } from '../src/features/users/schemas/user.schema'
import { MongoTestHelper } from '../src/shared/helper/mongo-test.helper'

describe('StudentsController (e2e)', () => {
    let app: INestApplication<App>
    let mongoTestHelper: MongoTestHelper
    let studentModel: Model<unknown>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        const userModel = mongoTestHelper.initModel(User.name, UserSchema)
        studentModel = userModel.discriminator(Student.name, StudentSchema) as Model<unknown>

        const module: TestingModule = await Test.createTestingModule({
            imports: [],
            controllers: [StudentsController],
            providers: [
                StudentsService,
                StudentRepository,
                {
                    provide: getModelToken(Student.name),
                    useValue: studentModel,
                },
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

    it('POST /api/students/sign-up', () => {
        const user: SignUpStudentDto = {
            name: 'test user',
            email: 'testUser@gmail.com',
            gender: Gender.male,
            password: 'testPassword',
        }
        const expectedResult: StudentDto = {
            name: 'test user',
            email: 'testUser@gmail.com',
            gender: Gender.male,
            subscriptions: [],
        }
        return request(app.getHttpServer())
            .post('/api/students/sign-up')
            .send(user)
            .expect(HttpStatus.CREATED)
            .expect(expectedResult)
    })
})
