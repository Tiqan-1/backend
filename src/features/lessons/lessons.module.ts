import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LessonsController } from './lessons.controller'
import { LessonsRepository } from './lessons.repository'
import { LessonsService } from './lessons.service'
import { Lesson, LessonSchema } from './schemas/lesson.schema'

@Module({
    imports: [MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }])],
    controllers: [LessonsController],
    providers: [LessonsService, LessonsRepository],
})
export class LessonsModule {}
