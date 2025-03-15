import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { Subject } from './schemas/subject.schema'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

describe('SubjectsService', () => {
    let service: SubjectsService
    let mongoTestHelper: MongoTestHelper
    let subjectModel: Model<Subject>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        subjectModel = mongoTestHelper.initSubject()
        const module: TestingModule = await Test.createTestingModule({
            providers: [SubjectsService, SubjectsRepository, { provide: getModelToken(Subject.name), useValue: subjectModel }],
        }).compile()

        service = module.get<SubjectsService>(SubjectsService)
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

    it('should create subject', async () => {
        const subjectDto: CreateSubjectDto = {
            name: 'test subject',
            description: 'test description',
            lessonIds: [],
        }

        const expected: Partial<SubjectDto> = {
            name: 'test subject',
            description: 'test description',
            lessons: [],
        }

        const result = (await service.create(subjectDto)) as Partial<SubjectDto>
        expect(result.id).toBeDefined()
        expect(result.name).toEqual(expected.name)
        expect(result.description).toEqual(expected.description)
        expect(result.lessons).toBeDefined()

        const savedSubject = await subjectModel.findOne()
        expect(savedSubject?.name).toEqual(expected.name)
    })
})
