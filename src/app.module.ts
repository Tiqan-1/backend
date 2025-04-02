import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'node:path'
import { AuthenticationModule } from './features/authentication/authentication.module'
import { LessonsModule } from './features/lessons/lessons.module'
import { LevelsModule } from './features/levels/levels.module'
import { ManagersModule } from './features/managers/managers.module'
import { ProgramsModule } from './features/programs/programs.module'
import { StudentsModule } from './features/students/students.module'
import { SubjectsModule } from './features/subjects/subjects.module'
import { SubscriptionsModule } from './features/subscriptions/subscriptions.module'
import { TasksModule } from './features/tasks/tasks.module'
import { TokensModule } from './features/tokens/tokens.module'
import { UsersModule } from './features/users/users.module'
import { SharedDocumentsModule } from './shared/documents-validator/shared-documents.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'static'), // Adjust path to the folder where your HTML files are stored
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
        LevelsModule,
        SharedDocumentsModule,
        SubscriptionsModule,
    ],
    providers: [],
})
export class AppModule {}
