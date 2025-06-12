import { Logger } from '@nestjs/common'
import { ProgramSubscriptionType } from '../../../features/programs/enums/program-subscription-type.enum'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V8 implements MigrationScript {
    private readonly logger = new Logger(V8.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V8.name}.`)
        const programs = await documentsService.getPrograms([])
        this.logger.log(`Found ${programs.length} programs to process.`)

        for (const program of programs) {
            program.subscriptionType = ProgramSubscriptionType.public
            await program.save()
        }

        this.logger.log(`Migration process of script ${V8.name} completed successfully.`)
    }
}
