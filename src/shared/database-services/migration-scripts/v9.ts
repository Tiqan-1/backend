import { Logger } from '@nestjs/common'
import { ProgramState } from '../../../features/programs/enums/program-state.enum'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V9 implements MigrationScript {
    private readonly logger = new Logger(V9.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V9.name}.`)
        const programs = await documentsService.getPrograms([])
        this.logger.log(`Found ${programs.length} programs to process.`)

        for (const program of programs) {
            if (program.state === ProgramState.published && !program.levels.length) {
                program.state = ProgramState.created
                await program.save()
            }
        }

        this.logger.log(`Migration process of script ${V9.name} completed successfully.`)
    }
}
