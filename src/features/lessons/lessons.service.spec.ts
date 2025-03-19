import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Model } from 'mongoose'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { LessonsRepository } from './lessons.repository'
import { LessonsService } from './lessons.service'
import { Lesson } from './schemas/lesson.schema'

describe('LessonsService', () => {
    let mongoTestHelper: MongoTestHelper
    let service: LessonsService
    let lessonModel: Model<Lesson>

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()
        lessonModel = mongoTestHelper.getLessonModel()
        const module: TestingModule = await Test.createTestingModule({
            providers: [LessonsService, LessonsRepository, { provide: getModelToken(Lesson.name), useValue: lessonModel }],
        }).compile()

        service = module.get<LessonsService>(LessonsService)
    })

    afterAll(async () => {
        await mongoTestHelper.tearDown()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
