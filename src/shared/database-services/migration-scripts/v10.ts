import { Logger } from '@nestjs/common'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V10 implements MigrationScript {
    private readonly logger = new Logger(V10.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V10.name}.`)
        const students = await documentsService.getStudents([])
        this.logger.log(`Found ${students.length} students to process.`)

        for (const student of students) {
            if (!student.academicNumber) {
                const counter = await documentsService.getCounter('academicNumber')

                student.academicNumber = `${counter.seq + 1}`
                counter.seq += 1
                await counter.save()
            }
            if (!student.country) {
                student.country = 'Unknown'
            }
            if (!student.phoneNumber) {
                student.phoneNumber = 'Unknown'
            }
            if (!student.dateOfBirth) {
                student.dateOfBirth = new Date('1990-01-01')
            }
        }

        this.logger.log(`Migration process of script ${V10.name} completed successfully.`)
    }
}
