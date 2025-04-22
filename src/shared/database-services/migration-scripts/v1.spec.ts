import mongoose from 'mongoose'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LessonState } from '../../../features/lessons/enums/lesson-state.enum'
import { LessonType } from '../../../features/lessons/enums/lesson-type.enum'
import { SharedDocumentsService } from '../shared-documents.service'
import { V1 } from './v1'

describe('V1', () => {
    let v1: V1
    let documentsService: SharedDocumentsService

    beforeEach(() => {
        documentsService = {
            getSubjects: vi.fn(),
        } as unknown as SharedDocumentsService

        v1 = new V1()
    })

    it('should update lessons with missing subjectId and createdBy', async () => {
        const subjectId = new mongoose.Types.ObjectId()
        const managerId = new mongoose.Types.ObjectId()

        const mockLesson = {
            title: 'Test Lesson',
            type: LessonType.video,
            url: 'test-url',
            state: LessonState.active,
            save: vi.fn(),
            subjectId: undefined,
            createdBy: undefined,
        }

        const mockSubject: any = {
            _id: subjectId,
            name: 'Test Subject',
            createdBy: managerId,
            lessons: [mockLesson],
            populate: vi.fn(),
        }

        vi.spyOn(documentsService, 'getSubjects').mockResolvedValueOnce([mockSubject])

        await v1.up(documentsService)

        expect(documentsService.getSubjects).toHaveBeenCalledWith([])
        expect(mockLesson.subjectId).toBe(subjectId)
        expect(mockLesson.createdBy).toBe(managerId)
        expect(mockLesson.save).toHaveBeenCalled()
    })

    it('should handle empty subjects array', async () => {
        vi.spyOn(documentsService, 'getSubjects').mockResolvedValueOnce([])

        await v1.up(documentsService)

        expect(documentsService.getSubjects).toHaveBeenCalledWith([])
    })

    it('should handle subjects with no lessons', async () => {
        const subjectId = new mongoose.Types.ObjectId()
        const managerId = new mongoose.Types.ObjectId()

        const mockSubject: any = {
            _id: subjectId,
            name: 'Test Subject',
            createdBy: managerId,
            lessons: [],
            populate: vi.fn(),
        }

        vi.spyOn(documentsService, 'getSubjects').mockResolvedValueOnce([mockSubject])

        await v1.up(documentsService)

        expect(documentsService.getSubjects).toHaveBeenCalledWith([])
        expect(mockSubject.populate).toHaveBeenCalledWith('lessons')
    })

    it('should not update lessons with existing subjectId and createdBy', async () => {
        const subjectId = new mongoose.Types.ObjectId()
        const managerId = new mongoose.Types.ObjectId()
        const existingSubjectId = new mongoose.Types.ObjectId()
        const existingManagerId = new mongoose.Types.ObjectId()

        const mockLesson = {
            title: 'Test Lesson',
            type: LessonType.video,
            url: 'test-url',
            state: LessonState.active,
            save: vi.fn(),
            subjectId: existingSubjectId,
            createdBy: existingManagerId,
        }

        const mockSubject: any = {
            _id: subjectId,
            name: 'Test Subject',
            createdBy: managerId,
            lessons: [mockLesson],
            populate: vi.fn(),
        }

        vi.spyOn(documentsService, 'getSubjects').mockResolvedValueOnce([mockSubject])

        await v1.up(documentsService)

        expect(documentsService.getSubjects).toHaveBeenCalledWith([])
        expect(mockLesson.subjectId).toBe(existingSubjectId)
        expect(mockLesson.createdBy).toBe(existingManagerId)
        expect(mockLesson.save).toHaveBeenCalled()
    })
})
