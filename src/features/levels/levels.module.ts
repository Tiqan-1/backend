import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { TasksModule } from '../tasks/tasks.module'
import { LevelsController } from './levels.controller'
import { LevelsRepository } from './levels.repository'
import { LevelsService } from './levels.service'

@Module({
    imports: [SharedDocumentsModule, TasksModule],
    controllers: [LevelsController],
    providers: [LevelsService, LevelsRepository],
    exports: [LevelsService],
})
export class LevelsModule {}
