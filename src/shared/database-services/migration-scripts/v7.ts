import { Logger } from '@nestjs/common'
import { TaskState } from '../../../features/tasks/enums'
import { TaskDocument } from '../../../features/tasks/schemas/task.schema'
import { ObjectId } from '../../repository/types'
import { SharedDocumentsService } from '../shared-documents.service'
import { MigrationScript } from './migration-script'

export class V7 implements MigrationScript {
    private readonly logger = new Logger(V7.name)

    async up(documentsService: SharedDocumentsService): Promise<void> {
        this.logger.log(`Starting migration process of script ${V7.name}.`)
        const levels = await documentsService.getLevels([])
        this.logger.log(`Found ${levels.length} levels to process.`)

        for (const level of levels) {
            const levelId = new ObjectId(level._id as ObjectId | string)
            const createdBy = new ObjectId(level.createdBy as ObjectId | string)
            await level.populate('tasks')
            if (!level.tasks.length) {
                this.logger.debug(`No tasks found for level: ${level.id}.`)
                continue
            }

            this.logger.debug(
                `Processing ${level.tasks.length} tasks of level: ${level.id} createdBy ${createdBy._id.toString()}.`
            )

            for (const task of level.tasks as TaskDocument[]) {
                task.levelId = levelId
                task.createdBy = createdBy
                await task.save()
            }
        }

        const tasks = await documentsService.getTasks([])
        const brokenTasks = tasks.filter(task => !task.levelId || !task.createdBy)
        this.logger.debug(`Found ${brokenTasks.length} broken tasks.`)
        for (const task of brokenTasks) {
            await task.updateOne({ $set: { state: TaskState.deleted } })
            this.logger.debug(`Deleted broken task: ${task.id}.`, task)
        }
        this.logger.log(`Migration process of script ${V7.name} completed successfully.`)
    }
}
