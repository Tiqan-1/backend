import { Logger } from '@nestjs/common'
import { ObjectId } from '../../repository/types'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V3 implements MigrationScript {
    private readonly logger = new Logger(V3.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V3.name}`)
        const programs = await documentsService.getPrograms([])
        this.logger.log(`Found ${programs.length} programs to process`)

        for (const program of programs) {
            const createdBy = new ObjectId(program.createdBy as ObjectId | string)
            this.logger.debug(`Processing program: ${program.name} createdBy ${createdBy._id.toString()}`)

            program.createdBy = createdBy
            await program.save()
        }
        this.logger.log(`Migration process of script ${V3.name} completed successfully`)
    }
}
