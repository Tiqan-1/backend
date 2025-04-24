import { Logger } from '@nestjs/common'
import { ObjectId } from '../../repository/types'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V4 implements MigrationScript {
    private readonly logger = new Logger(V4.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V4.name}`)
        const subjects = await documentsService.getSubjects([])
        this.logger.log(`Found ${subjects.length} subjects to process`)

        for (const subject of subjects) {
            const createdBy = new ObjectId(subject.createdBy as ObjectId | string)
            this.logger.debug(`Processing subject: ${subject.name} createdBy ${createdBy._id.toString()}`)

            subject.createdBy = createdBy
            await subject.save()
        }
        this.logger.log(`Migration process of script ${V4.name} completed successfully`)
    }
}
