import { Test } from '@nestjs/testing'
import { Types } from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LevelDocument } from '../../../features/levels/schemas/level.schema'
import { SharedDocumentsService } from '../shared-documents.service'
import { V2 } from './v2'

describe('V2', () => {
    let v2: V2
    let mockSharedDocumentsService: SharedDocumentsService

    beforeEach(async () => {
        mockSharedDocumentsService = {
            getPrograms: vi.fn(),
        } as any

        const moduleRef = await Test.createTestingModule({
            providers: [
                V2,
                {
                    provide: SharedDocumentsService,
                    useValue: mockSharedDocumentsService,
                },
            ],
        }).compile()

        v2 = moduleRef.get<V2>(V2)
    })

    describe('up', () => {
        it('should update levels with program id and created by', async () => {
            const programId = new Types.ObjectId()
            const createdBy = new Types.ObjectId()
            const mockLevel = {
                save: vi.fn(),
            } as any as LevelDocument

            const mockProgram: any = {
                _id: programId,
                name: 'Test Program',
                createdBy: createdBy,
                levels: [mockLevel],
                populate: vi.fn().mockResolvedValue({
                    _id: programId,
                    name: 'Test Program',
                    createdBy: createdBy,
                    levels: [mockLevel],
                }),
            }

            vi.spyOn(mockSharedDocumentsService, 'getPrograms').mockResolvedValue([mockProgram])

            await v2.up(mockSharedDocumentsService)

            expect(mockSharedDocumentsService.getPrograms).toHaveBeenCalledWith([])
            expect(mockProgram.populate).toHaveBeenCalledWith('levels')
            expect(mockLevel.programId).toBe(programId)
            expect(mockLevel.createdBy).toBe(createdBy)
            expect(mockLevel.save).toHaveBeenCalled()
        })
    })
})
