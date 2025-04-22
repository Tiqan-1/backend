import { Logger } from '@nestjs/common'
import { LevelDocument } from '../../../features/levels/schemas/level.schema'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V2 implements MigrationScript {
    private readonly logger = new Logger(V2.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V2.name}`)
        const programs = await documentsService.getPrograms([])
        this.logger.log(`Found ${programs.length} programs to process`)

        for (const program of programs) {
            await program.populate('levels')
            this.logger.debug(`Processing program: ${program.name} with ${program.levels.length} levels`)

            for (const level of program.levels as LevelDocument[]) {
                if (!level.programId) {
                    level.programId = program._id
                }
                if (!level.createdBy) {
                    level.createdBy = program.createdBy
                }
                await level.save()
            }
        }
        this.logger.log(`Migration process of script ${V2.name} completed successfully`)
    }
}
