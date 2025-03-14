import { Test, TestingModule } from '@nestjs/testing'
import { SubjectsController } from './subjects.controller'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

describe('SubjectsController (e2e)', () => {
    let controller: SubjectsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubjectsController],
            providers: [SubjectsService, SubjectsRepository],
        }).compile()

        controller = module.get<SubjectsController>(SubjectsController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
