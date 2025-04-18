import { SharedDocumentsService } from '../shared-documents.service'

export interface MigrationScript {
    up(documentsService: SharedDocumentsService): Promise<void>
}
