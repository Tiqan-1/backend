import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
    AssignmentResponse,
    AssignmentResponseSchema,
} from '../../features/assignment-responses/schemas/assignment-response.schema'
import { Assignment, AssignmentSchema } from '../../features/assignments/schemas/assignment.schema'
import { VerificationCode, VerificationCodeSchema } from '../../features/authentication/schema/verification-code.schema'
import { Chat, ChatSchema } from '../../features/chat/schemas/chat.schema'
import { Message, MessageSchema } from '../../features/chat/schemas/message.schema'
import { Lesson, LessonSchema } from '../../features/lessons/schemas/lesson.schema'
import { Level, LevelSchema } from '../../features/levels/schemas/level.schema'
import { Manager, ManagerSchema } from '../../features/managers/schemas/manager.schema'
import { Permission, PermissionSchema } from '../../features/permissions/schemas/permission.schema'
import { Program, ProgramSchema } from '../../features/programs/schemas/program.schema'
import { Student, StudentSchema } from '../../features/students/schemas/student.schema'
import { Subject, SubjectSchema } from '../../features/subjects/schemas/subject.schema'
import { Subscription, SubscriptionSchema } from '../../features/subscriptions/schemas/subscription.schema'
import { Task, TaskSchema } from '../../features/tasks/schemas/task.schema'
import { User, UserSchema } from '../../features/users/schemas/user.schema'
import { MigrationService } from './migration.service'
import { DbVersion, DbVersionSchema } from './schema/db-version.schema'
import { SharedDocumentsService } from './shared-documents.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DbVersion.name, schema: DbVersionSchema }]),
        MongooseModule.forFeature([{ name: Assignment.name, schema: AssignmentSchema }]),
        MongooseModule.forFeature([{ name: AssignmentResponse.name, schema: AssignmentResponseSchema }]),
        MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
        MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]),
        MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
        MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]),
        MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
        MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
        MongooseModule.forFeature([{ name: VerificationCode.name, schema: VerificationCodeSchema }]),
        MongooseModule.forFeature([{ name: Permission.name, schema: PermissionSchema }]),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Manager.name, schema: ManagerSchema }] },
        ]),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Student.name, schema: StudentSchema }] },
        ]),
    ],
    providers: [SharedDocumentsService, MigrationService],
    exports: [SharedDocumentsService, MigrationService, MongooseModule],
})
export class SharedDocumentsModule {}
