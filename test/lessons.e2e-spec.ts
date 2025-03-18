import { Test, TestingModule } from '@nestjs/testing'
import { LessonsController } from '../src/features/lessons/lessons.controller'

describe('LessonsController (e2e)', () => {
    let controller: LessonsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LessonsController],
        }).compile()

        controller = module.get<LessonsController>(LessonsController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
