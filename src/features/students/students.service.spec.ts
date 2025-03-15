import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { SignUpStudentDto, StudentDto } from './dto/student.dto'
import { Gender } from './enums/gender'
import { Student } from './schemas/student.schema'
import { StudentRepository } from './students.repository'
import { StudentsService } from './students.service'

describe('StudentsService', () => {
    let service: StudentsService
    let mongoTestHelper: MongoTestHelper
    let studentModel: Model<Student>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        studentModel = mongoTestHelper.initStudent()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudentsService,
                StudentRepository,
                {
                    provide: getModelToken(Student.name),
                    useValue: studentModel,
                },
            ],
        }).compile()

        service = module.get<StudentsService>(StudentsService)
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
    })

    afterEach(async () => {
        await mongoTestHelper.clearCollections()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should create student', async () => {
        const studentDto: SignUpStudentDto = {
            name: 'test student',
            password: 'test password',
            gender: Gender.male,
            email: 'student@email.com',
        }

        const expected: StudentDto = {
            name: 'test student',
            gender: Gender.male,
            email: 'student@email.com',
            subscriptions: [],
        }

        const result = await service.create(studentDto)

        expect(result).toEqual(expected)

        const savedStudent = await studentModel.findOne()
        expect(savedStudent?.password).toBeDefined()
        expect(savedStudent?.password).not.toEqual('test password')
    })
})
