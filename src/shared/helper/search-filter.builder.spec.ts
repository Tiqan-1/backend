import { beforeEach, describe, expect, it } from 'vitest'
import { ObjectId } from '../repository/types'
import { SearchFilterBuilder } from './search-filter.builder'

describe('SearchFilterBuilder', () => {
    let builder: SearchFilterBuilder

    beforeEach(() => {
        builder = SearchFilterBuilder.init()
    })

    it('should initialize an empty filter', () => {
        expect(builder.build()).toEqual({})
    })

    describe('withObjectId', () => {
        it('should add filter with ObjectId when id is provided', () => {
            const testId = '60f1b9b3b3b3b3b3b3b3b3b3'
            const expectedObjectId = new ObjectId(testId)
            const filter = builder.withObjectId('_id', testId).build()

            expect(filter).toHaveProperty('_id')
            expect(filter._id).toEqual(expectedObjectId)
        })

        it('should not add filter when id is undefined', () => {
            const filter = builder.withObjectId('_id', undefined).build()
            expect(filter).not.toHaveProperty('_id')
            expect(filter).toEqual({})
        })

        it('should return the builder instance for chaining', () => {
            const testId = '60f1b9b3b3b3b3b3b3b3b3b3'
            expect(builder.withObjectId('_id', testId)).toBeInstanceOf(SearchFilterBuilder)
        })
    })

    describe('withParam', () => {
        it('should add a key-value pair when value is provided', () => {
            const key = 'status'
            const value = 'active'
            const filter = builder.withParam(key, value).build()
            expect(filter).toEqual({ [key]: value })
        })

        it('should add a key-value pair even if value is falsy (0, false)', () => {
            const filter1 = builder.withParam('count', 0).build()
            expect(filter1).toEqual({ count: 0 })

            builder = SearchFilterBuilder.init() // Reset builder
            const filter2 = builder.withParam('isActive', false).build()
            expect(filter2).toEqual({ isActive: false })
        })

        it('should not add the key when value is undefined', () => {
            const filter = builder.withParam('status', undefined).build()
            expect(filter).not.toHaveProperty('status')
            expect(filter).toEqual({})
        })

        it('should not add the key when value is null', () => {
            const filter = builder.withParam('status', null).build()
            expect(filter).not.toHaveProperty('status')
            expect(filter).toEqual({})
        })

        it('should return the builder instance for chaining', () => {
            expect(builder.withParam('key', 'value')).toBeInstanceOf(SearchFilterBuilder)
        })
    })

    describe('withStringLike', () => {
        it('should add a case-insensitive regex filter when value is provided', () => {
            const key = 'name'
            const value = 'Test'
            const filter = builder.withStringLike(key, value).build()
            expect(filter).toEqual({ [key]: { $regex: value, $options: 'i' } })
        })

        it('should not add the key when value is undefined', () => {
            const filter = builder.withStringLike('name', undefined).build()
            expect(filter).not.toHaveProperty('name')
            expect(filter).toEqual({})
        })

        it('should not add the key when value is an empty string', () => {
            const filter = builder.withStringLike('name', '').build()
            expect(filter).not.toHaveProperty('name')
            expect(filter).toEqual({})
        })

        it('should return the builder instance for chaining', () => {
            expect(builder.withStringLike('key', 'value')).toBeInstanceOf(SearchFilterBuilder)
        })
    })

    describe('withDateAfter', () => {
        it('should add a $gte date filter when date is provided', () => {
            const key = 'startDate'
            const date = new Date('2023-01-01T00:00:00.000Z')
            const filter = builder.withDateAfter(key, date).build()
            expect(filter).toEqual({ [key]: { $gte: date } })
        })

        it('should not add the key when date is undefined', () => {
            const filter = builder.withDateAfter('startDate', undefined).build()
            expect(filter).not.toHaveProperty('startDate')
            expect(filter).toEqual({})
        })

        it('should return the builder instance for chaining', () => {
            expect(builder.withDateAfter('key', new Date())).toBeInstanceOf(SearchFilterBuilder)
        })
    })

    describe('withDateBefore', () => {
        it('should add a $lte date filter when date is provided', () => {
            const key = 'endDate'
            const date = new Date('2023-12-31T23:59:59.999Z')
            const filter = builder.withDateBefore(key, date).build()
            expect(filter).toEqual({ [key]: { $lte: date } })
        })

        it('should not add the key when date is undefined', () => {
            const filter = builder.withDateBefore('endDate', undefined).build()
            expect(filter).not.toHaveProperty('endDate')
            expect(filter).toEqual({})
        })

        it('should return the builder instance for chaining', () => {
            expect(builder.withDateBefore('key', new Date())).toBeInstanceOf(SearchFilterBuilder)
        })
    })

    describe('build', () => {
        it('should return the final filter object', () => {
            const filter = builder.build()
            expect(typeof filter).toBe('object')
            expect(filter).not.toBeNull()
        })

        it('should return an object with all combined filters', () => {
            const testId = '60f1b9b3b3b3b3b3b3b3b3b3'
            const nameValue = 'Search Term'
            const statusValue = 'pending'
            const startDate = new Date('2023-05-01')
            const endDate = new Date('2023-05-31')

            const filter = builder
                .withObjectId('_id', testId)
                .withParam('status', statusValue)
                .withStringLike('name', nameValue)
                .withDateAfter('startDate', startDate)
                .withDateBefore('endDate', endDate)
                .withParam('ignored', undefined) // Ensure undefined doesn't add key
                .withParam('count', 0) // Ensure 0 is added
                .withParam('active', false) // Ensure false is added
                .build()

            expect(filter).toHaveProperty('_id')
            expect(filter._id).toEqual(new ObjectId(testId))
            expect(filter).toHaveProperty('status', statusValue)
            expect(filter).toHaveProperty('name', { $regex: nameValue, $options: 'i' })
            expect(filter).toHaveProperty('startDate', { $gte: startDate })
            expect(filter).toHaveProperty('endDate', { $lte: endDate })
            expect(filter).toHaveProperty('count', 0)
            expect(filter).toHaveProperty('active', false)
            expect(filter).not.toHaveProperty('ignored') // Verify undefined was ignored
        })

        it('should handle overlapping keys by overwriting (last one wins)', () => {
            const key = 'createdAt'
            const afterDate = new Date('2023-01-01')
            const beforeDate = new Date('2023-01-31')
            const exactValue = 'specificValue'

            const filter = builder
                .withDateAfter(key, afterDate)
                .withDateBefore(key, beforeDate)
                .withParam(key, exactValue)
                .build()

            // The builder currently overwrites the key with each call.
            expect(filter).toEqual({ [key]: exactValue }) // Last one wins
        })
    })
})
