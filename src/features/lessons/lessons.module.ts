import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthenticationModule } from '../authentication/authentication.module'
import { LessonsController } from './lessons.controller'
import { LessonsRepository } from './lessons.repository'
import { LessonsService } from './lessons.service'
import { Lesson, LessonSchema } from './schemas/lesson.schema'

@Module({
    imports: [MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]), AuthenticationModule],
    controllers: [LessonsController],
    providers: [LessonsService, LessonsRepository],
    exports: [LessonsRepository],
})
export class LessonsModule {}
