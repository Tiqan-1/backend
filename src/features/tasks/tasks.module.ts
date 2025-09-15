import { forwardRef, Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/database-services/shared-documents.module'
import { AssignmentsModule } from '../assignments/assignments.module'
import { ChatModule } from '../chat/chat.module'
import { LessonsModule } from '../lessons/lessons.module'
import { TasksController } from './tasks.controller'
import { TasksRepository } from './tasks.repository'
import { TasksService } from './tasks.service'

@Module({
    imports: [SharedDocumentsModule, LessonsModule, ChatModule, forwardRef(() => AssignmentsModule)],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
    exports: [TasksService],
})
export class TasksModule {}
