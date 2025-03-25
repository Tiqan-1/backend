import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProgramsModule } from '../programs/programs.module'
import { TasksModule } from '../tasks/tasks.module'
import { LevelsController } from './levels.controller'
import { LevelsRepository } from './levels.repository'
import { LevelsService } from './levels.service'
import { Level, LevelSchema } from './schemas/level.schema'

@Module({
    imports: [MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]), ProgramsModule, TasksModule],
    controllers: [LevelsController],
    providers: [LevelsService, LevelsRepository],
})
export class LevelsModule {}
