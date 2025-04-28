import { PaginatedDto } from '../dto/paginated.dto'

export class PaginationHelper {
    static calculateSkip(page: number = 1, pageSize: number = 20): number {
        if (page <= 0) {
            return 0
        }
        return (page - 1) * pageSize
    }

    static emptyResponse<T>(page: number = 1, pageSize: number = 20): PaginatedDto<T> {
        return { items: [], page, pageSize, total: 0 }
    }

    static wrapResponse<T>(response: T[], page: number = 1, pageSize: number = 20, total: number = 0): PaginatedDto<T> {
        return { items: response, page, pageSize, total }
    }
}
