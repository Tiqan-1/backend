import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsInt, Max, Min } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { ObjectId } from '../../../shared/repository/types'
import { OralTestSlot } from '../schemas/task.schema'

export class OralTestSlotDto {
    @ApiProperty({ type: String, required: true })
    id: string

    @ApiProperty({ type: Date, required: true })
    startsAt: Date

    @ApiProperty({ type: Number, required: true })
    durationMinutes: number

    @ApiProperty({ type: Boolean, required: true, description: 'True when this slot has been booked by a student.' })
    booked: boolean

    @ApiProperty({ type: String, required: false, description: 'Student id of the booker. Only exposed to managers.' })
    bookedBy?: string

    @ApiProperty({ type: Date, required: false })
    bookedAt?: Date

    @ApiProperty({ type: Number, required: false })
    grade?: number

    @ApiProperty({ type: String, required: false })
    feedback?: string

    @ApiProperty({ type: Date, required: false })
    gradedAt?: Date

    static fromDocument(slot: OralTestSlot, opts?: { exposeBookedBy?: boolean }): OralTestSlotDto {
        const dto = new OralTestSlotDto()
        dto.id = slot._id.toString()
        dto.startsAt = slot.startsAt
        dto.durationMinutes = slot.durationMinutes
        dto.booked = !!slot.bookedBy
        if (opts?.exposeBookedBy && slot.bookedBy) {
            dto.bookedBy = (slot.bookedBy as ObjectId).toString()
            dto.bookedAt = slot.bookedAt
        }
        dto.grade = slot.grade
        dto.feedback = slot.feedback
        dto.gradedAt = slot.gradedAt
        return dto
    }
}

export class CreateOralTestSlotDto {
    @ApiProperty({ type: Date, required: true })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date', { property: 'startsAt' }) })
    startsAt: Date

    @ApiProperty({ type: Number, required: true, minimum: 5, maximum: 240 })
    @Type(() => Number)
    @IsInt({ message: i18nValidationMessage('validation.number', { property: 'durationMinutes' }) })
    @Min(5, { message: i18nValidationMessage('validation.min', { property: 'durationMinutes', min: 5 }) })
    @Max(240, { message: i18nValidationMessage('validation.max', { property: 'durationMinutes', max: 240 }) })
    durationMinutes: number
}
