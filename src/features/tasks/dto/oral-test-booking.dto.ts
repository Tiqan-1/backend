import { ApiProperty } from '@nestjs/swagger'
import { StudentDocument } from '../../students/schemas/student.schema'
import { OralTestSlot } from '../schemas/task.schema'

export class OralTestBookingStudentDto {
    @ApiProperty({ type: String, required: true })
    id: string

    @ApiProperty({ type: String, required: true })
    name: string

    @ApiProperty({ type: String, required: true })
    email: string
}

export class OralTestBookingDto {
    @ApiProperty({ type: String, required: true })
    slotId: string

    @ApiProperty({ type: Date, required: true })
    startsAt: Date

    @ApiProperty({ type: Number, required: true })
    durationMinutes: number

    @ApiProperty({ type: Date, required: true })
    bookedAt: Date

    @ApiProperty({ type: OralTestBookingStudentDto, required: true })
    student: OralTestBookingStudentDto

    @ApiProperty({ type: Number, required: false })
    grade?: number

    @ApiProperty({ type: String, required: false })
    feedback?: string

    @ApiProperty({ type: Date, required: false })
    gradedAt?: Date

    static fromSlot(slot: OralTestSlot): OralTestBookingDto {
        const student = slot.bookedBy as StudentDocument
        const dto = new OralTestBookingDto()
        dto.slotId = slot._id.toString()
        dto.startsAt = slot.startsAt
        dto.durationMinutes = slot.durationMinutes
        dto.bookedAt = slot.bookedAt as Date
        dto.student = {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
        }
        dto.grade = slot.grade
        dto.feedback = slot.feedback
        dto.gradedAt = slot.gradedAt
        return dto
    }
}
