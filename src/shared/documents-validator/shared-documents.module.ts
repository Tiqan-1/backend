import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Lesson, LessonSchema } from '../../features/lessons/schemas/lesson.schema'
import { Level, LevelSchema } from '../../features/levels/schemas/level.schema'
import { Manager, ManagerSchema } from '../../features/managers/schemas/manager.schema'
import { Program, ProgramSchema } from '../../features/programs/schemas/program.schema'
import { Student, StudentSchema } from '../../features/students/schemas/student.schema'
import { Subject, SubjectSchema } from '../../features/subjects/schemas/subject.schema'
import { Subscription } from '../../features/subscriptions/schemas/subscription.schema'
import { Task, TaskSchema } from '../../features/tasks/schemas/task.schema'
import { User, UserSchema } from '../../features/users/schemas/user.schema'
import { SharedDocumentsService } from './shared-documents.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
        MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]),
        MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
        MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]),
        MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
        MongooseModule.forFeature([{ name: Subscription.name, schema: SubjectSchema }]),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Manager.name, schema: ManagerSchema }] },
        ]),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Student.name, schema: StudentSchema }] },
        ]),
    ],
    providers: [SharedDocumentsService],
    exports: [SharedDocumentsService, MongooseModule],
})
export class SharedDocumentsModule {}
