import { describe, expect, it } from 'vitest'
import { PaginationHelper } from './pagination-helper'

describe('PaginationHelper', () => {
    describe('calculateSkip', () => {
        it('should return 0 for the first page', () => {
            expect(PaginationHelper.calculateSkip(1, 10)).toBe(0)
        })

        it('should calculate skip correctly for various pages and page sizes', () => {
            expect(PaginationHelper.calculateSkip(2, 10)).toBe(10)
            expect(PaginationHelper.calculateSkip(3, 15)).toBe(30)
            expect(PaginationHelper.calculateSkip(5, 20)).toBe(80)
        })

        it('should handle page 0', () => {
            expect(PaginationHelper.calculateSkip(0, 10)).toBe(0)
        })

        it('should handle negative page numbers', () => {
            expect(PaginationHelper.calculateSkip(-1, 10)).toBe(0)
        })

        it('should handle zero page size', () => {
            expect(PaginationHelper.calculateSkip(5, 0)).toBe(0)
        })
    })

    describe('emptyResponse', () => {
        it('should return an empty paginated response with correct metadata', () => {
            const page = 2
            const pageSize = 15
            const result = PaginationHelper.emptyResponse<string>(page, pageSize)

            expect(result).toEqual({
                items: [],
                page: 2,
                pageSize: 15,
                total: 0,
            })
            expect(result.items).toHaveLength(0)
        })
    })

    describe('wrapResponse', () => {
        it('should wrap array data in a paginated response with metadata', () => {
            const items = ['item1', 'item2', 'item3']
            const page = 2
            const pageSize = 10
            const total = 23

            const result = PaginationHelper.wrapResponse(items, page, pageSize, total)

            expect(result).toEqual({
                items,
                page,
                pageSize,
                total,
            })
            expect(result.items).toEqual(items)
        })

        it('should handle an empty array', () => {
            const items: number[] = []
            const result = PaginationHelper.wrapResponse(items, 1, 20, 0)

            expect(result).toEqual({
                items: [],
                page: 1,
                pageSize: 20,
                total: 0,
            })
            expect(result.items).toEqual(items)
        })
    })
})
