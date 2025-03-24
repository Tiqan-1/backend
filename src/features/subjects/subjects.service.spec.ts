import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { TokenUser } from '../authentication/types/token-user'
import { LessonsRepository } from '../lessons/lessons.repository'
import { LessonsService } from '../lessons/lessons.service'
import { Lesson } from '../lessons/schemas/lesson.schema'
import { ManagersRepository } from '../managers/managers.repository'
import { ManagersService } from '../managers/managers.service'
import { Manager } from '../managers/schemas/manager.schema'
import { CreateSubjectDto } from './dto/subject.dto'
import { Subject } from './schemas/subject.schema'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

describe('SubjectsService', () => {
    let service: SubjectsService
    let mongoTestHelper: MongoTestHelper
    let subjectModel: Model<Subject>
    let lessonModel: Model<Lesson>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        lessonModel = mongoTestHelper.getLessonModel()
        subjectModel = mongoTestHelper.getSubjectModel()
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubjectsService,
                SubjectsRepository,
                LessonsService,
                LessonsRepository,
                ManagersService,
                ManagersRepository,
                { provide: getModelToken(Subject.name), useValue: subjectModel },
                { provide: getModelToken(Lesson.name), useValue: lessonModel },
                { provide: getModelToken(Manager.name), useValue: mongoTestHelper.getManagerModel() },
            ],
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

        const expectedName = 'test subject'

        const manager = await mongoTestHelper.createManager()
        const tokenUser: TokenUser = { id: manager._id, role: manager.role }
        const result = await service.create(subjectDto, tokenUser)
        expect(result.id).toBeDefined()

        const savedSubject = await subjectModel.findOne()
        expect(savedSubject?.name).toEqual(expectedName)
    })
})
