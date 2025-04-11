export class SearchFilterBuilder {
    private filter: Record<string, unknown> = {}
    constructor() {}

    static init(): SearchFilterBuilder {
        return new SearchFilterBuilder()
    }

    withParam(key: string, value?: unknown): SearchFilterBuilder {
        if (value) {
            this.filter[key] = value
        }
        return this
    }

    withStringLike(key: string, value?: string): SearchFilterBuilder {
        if (value) {
            this.filter[key] = { $regex: value, $options: 'i' }
        }
        return this
    }

    withDateAfter(key: string, date?: Date): SearchFilterBuilder {
        if (date) {
            this.filter[key] = { $gte: date }
        }
        return this
    }

    withDateBefore(key: string, date?: Date): SearchFilterBuilder {
        if (date) {
            this.filter[key] = { $lte: date }
        }
        return this
    }

    build(): Record<string, unknown> {
        return this.filter
    }
}
