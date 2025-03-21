export function normalizeDate(date: Date): Date {
    return new Date(date.setHours(0, 0, 0, 0))
}
