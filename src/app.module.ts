import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthenticationModule } from './features/authentication/authentication.module'
import { LessonsModule } from './features/lessons/lessons.module'
import { ManagersModule } from './features/managers/managers.module'
import { ProgramsModule } from './features/programs/programs.module'
import { StudentsModule } from './features/students/students.module'
import { SubjectsModule } from './features/subjects/subjects.module'
import { TasksModule } from './features/tasks/tasks.module'
import { TokensModule } from './features/tokens/tokens.module'
import { UsersModule } from './features/users/users.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI as string),
        UsersModule,
        AuthenticationModule,
        TokensModule,
        ManagersModule,
        StudentsModule,
        SubjectsModule,
        LessonsModule,
        TasksModule,
        ProgramsModule,
    ],
    providers: [],
})
export class AppModule {}
