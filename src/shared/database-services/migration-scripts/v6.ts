import { Logger } from '@nestjs/common'
import { ObjectId } from '../../repository/types'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V6 implements MigrationScript {
    private readonly logger = new Logger(V6.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V6.name}`)
        const levels = await documentsService.getLevels([])
        this.logger.log(`Found ${levels.length} levels to process`)

        for (const level of levels) {
            const createdBy = new ObjectId(level.createdBy as ObjectId | string)
            this.logger.debug(`Processing level: ${level.id} createdBy ${createdBy._id.toString()}`)

            level.createdBy = createdBy
            await level.save()
        }
        this.logger.log(`Migration process of script ${V6.name} completed successfully`)
    }
}
