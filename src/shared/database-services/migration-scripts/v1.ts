import { Logger } from '@nestjs/common'
import { LessonDocument } from '../../../features/lessons/schemas/lesson.schema'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V1 implements MigrationScript {
    private readonly logger = new Logger(V1.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V1.name}`)
        const subjects = await documentsService.getSubjects([])
        this.logger.log(`Found ${subjects.length} subjects to process`)

        for (const subject of subjects) {
            await subject.populate('lessons')
            this.logger.debug(`Processing subject: ${subject.name} with ${subject.lessons.length} lessons`)

            for (const lesson of subject.lessons as LessonDocument[]) {
                if (!lesson.subjectId) {
                    lesson.subjectId = subject._id
                }
                if (!lesson.createdBy) {
                    lesson.createdBy = subject.createdBy
                }
                await lesson.save()
            }
        }
        this.logger.log(`Migration process of script ${V1.name} completed successfully`)
    }
}
