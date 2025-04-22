import { Injectable, Logger } from '@nestjs/common'
import { MIGRATION_SCRIPTS_MAP } from './migration-scripts/migration-scripts.map'
import { SharedDocumentsService } from './shared-documents.service'

@Injectable()
export class MigrationService {
    private readonly logger = new Logger(MigrationService.name)

    constructor(private readonly documentsService: SharedDocumentsService) {}

    async migrate(): Promise<void> {
        const dbVersion = await this.documentsService.getDbVersion()
        if (dbVersion.version > MIGRATION_SCRIPTS_MAP.size) {
            this.logger.log(
                `Migration not needed. Current version is ${dbVersion.version}. Max version is ${MIGRATION_SCRIPTS_MAP.size}.`
            )
            return
        }

        this.logger.log('Starting migration process')

        while (dbVersion.version <= MIGRATION_SCRIPTS_MAP.size) {
            const migrationScript = MIGRATION_SCRIPTS_MAP.get(dbVersion.version)
            if (!migrationScript) {
                this.logger.error(`Migration to version ${dbVersion.version} not found`)
                return
            }
            await migrationScript?.up(this.documentsService)
            this.logger.log(`Migration to version ${dbVersion.version} completed`)
            dbVersion.version++
            await dbVersion.save()
        }
        this.logger.log(`Migration to version ${dbVersion.version} completed successfully`)
    }
}
