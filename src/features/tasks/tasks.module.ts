import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { TasksController } from './tasks.controller'
import { TasksRepository } from './tasks.repository'
import { TasksService } from './tasks.service'

@Module({
    imports: [SharedDocumentsModule],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
    exports: [TasksService],
})
export class TasksModule {}
