import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LessonsModule } from '../lessons/lessons.module'
import { Task, TaskSchema } from './schemas/task.schema'
import { TasksController } from './tasks.controller'
import { TasksRepository } from './tasks.repository'
import { TasksService } from './tasks.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]), LessonsModule],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
    exports: [TasksService],
})
export class TasksModule {}
