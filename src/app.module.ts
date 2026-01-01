import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ServeStaticModule } from '@nestjs/serve-static'
import { I18nModule } from 'nestjs-i18n'
import { PusherModule } from 'nestjs-pusher'
import { join } from 'node:path'
import * as process from 'node:process'
import { AssignmentResponsesModule } from './features/assignment-responses/assignment-responses.module'
import { AssignmentsModule } from './features/assignments/assignments.module'
import { AuthenticationModule } from './features/authentication/authentication.module'
import { ChatModule } from './features/chat/chat.module'
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
import { SharedDocumentsModule } from './shared/database-services/shared-documents.module'
import { EmailModule } from './shared/email/email.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'static'), // Adjust path to the folder where your HTML files are stored
        }),
        I18nModule.forRoot({
            fallbackLanguage: 'ar',
            loaderOptions: {
                path: join(__dirname, '/i18n/'),
                watch: true,
            },
        }),
        MongooseModule.forRoot(process.env.MONGODB_URI as string),
        PusherModule.forRoot(
            {
                key: process.env.PUSHER_APP_KEY as string,
                appId: process.env.PUSHER_APP_ID as string,
                secret: process.env.PUSHER_SECRET as string,
                cluster: process.env.PUSHER_CLUSTER as string,
                useTLS: true,
            },
            undefined,
            true
        ),
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
        ChatModule,
        AssignmentsModule,
        AssignmentResponsesModule,
        EmailModule,
    ],
    providers: [],
})
export class AppModule {}
