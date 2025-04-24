import { Logger } from '@nestjs/common'
import { ObjectId } from '../../repository/types'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V5 implements MigrationScript {
    private readonly logger = new Logger(V5.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V5.name}`)
        const lessons = await documentsService.getLessons([])
        this.logger.log(`Found ${lessons.length} lessons to process`)

        for (const lesson of lessons) {
            const createdBy = new ObjectId(lesson.createdBy as ObjectId | string)
            this.logger.debug(`Processing lesson: ${lesson.id} createdBy ${createdBy._id.toString()}`)

            lesson.createdBy = createdBy
            await lesson.save()
        }
        this.logger.log(`Migration process of script ${V5.name} completed successfully`)
    }
}
