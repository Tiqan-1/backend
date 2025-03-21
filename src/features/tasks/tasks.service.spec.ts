import { getModelToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { MongoTestHelper } from '../../shared/test/helper/mongo-test.helper'
import { LessonsRepository } from '../lessons/lessons.repository'
import { LessonsService } from '../lessons/lessons.service'
import { Lesson } from '../lessons/schemas/lesson.schema'
import { Task } from './schemas/task.schema'
import { TasksRepository } from './tasks.repository'
import { TasksService } from './tasks.service'

describe('TasksService', () => {
    let service: TasksService
    let mongoTestHelper: MongoTestHelper

    beforeAll(async () => {
        mongoTestHelper = await MongoTestHelper.instance()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                TasksRepository,
                LessonsService,
                LessonsRepository,
                {
                    provide: getModelToken(Task.name),
                    useValue: mongoTestHelper.getTaskModel(),
                },
                {
                    provide: getModelToken(Lesson.name),
                    useValue: mongoTestHelper.getLessonModel(),
                },
            ],
        }).compile()

        service = module.get<TasksService>(TasksService)
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
})
