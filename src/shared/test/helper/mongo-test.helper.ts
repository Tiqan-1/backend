import { Provider } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import * as bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import {
    AssignmentResponse,
    AssignmentResponseSchema,
} from '../../../features/assignment-responses/schemas/assignment-response.schema'
import { AssignmentGradingState } from '../../../features/assignments/enums/assignment-grading-state.enum'
import { AssignmentState, AssignmentType } from '../../../features/assignments/enums/assignment-state.enum'
import { Assignment, AssignmentDocument, AssignmentSchema } from '../../../features/assignments/schemas/assignment.schema'
import { Role } from '../../../features/authentication/enums/role.enum'
import { VerificationCode, VerificationCodeSchema } from '../../../features/authentication/schema/verification-code.schema'
import { Chat, ChatSchema } from '../../../features/chat/schemas/chat.schema'
import { Message, MessageSchema } from '../../../features/chat/schemas/message.schema'
import { LessonState } from '../../../features/lessons/enums/lesson-state.enum'
import { LessonType } from '../../../features/lessons/enums/lesson-type.enum'
import { Lesson, LessonDocument, LessonSchema } from '../../../features/lessons/schemas/lesson.schema'
import { LevelState } from '../../../features/levels/enums/level-stats.enum'
import { Level, LevelDocument, LevelSchema } from '../../../features/levels/schemas/level.schema'
import { SignUpManagerDto } from '../../../features/managers/dto/manager.dto'
import { Manager, ManagerDocument, ManagerSchema } from '../../../features/managers/schemas/manager.schema'
import { ProgramState } from '../../../features/programs/enums/program-state.enum'
import { ProgramSubscriptionType } from '../../../features/programs/enums/program-subscription-type.enum'
import { Program, ProgramDocument, ProgramSchema } from '../../../features/programs/schemas/program.schema'
import { Gender } from '../../../features/students/enums/gender'
import { Student, StudentDocument, StudentSchema } from '../../../features/students/schemas/student.schema'
import { Subject, SubjectDocument, SubjectSchema } from '../../../features/subjects/schemas/subject.schema'
import { SubscriptionState } from '../../../features/subscriptions/enums/subscription-state.enum'
import {
    Subscription,
    SubscriptionDocument,
    SubscriptionSchema,
} from '../../../features/subscriptions/schemas/subscription.schema'
import { TaskState, TaskType } from '../../../features/tasks/enums'
import {
    AssignmentTask,
    AssignmentTaskSchema,
    LessonTask,
    LessonTaskDocument,
    LessonTaskSchema,
    MeetingTask,
    MeetingTaskSchema,
    OralTestSlot,
    OralTestTask,
    OralTestTaskDocument,
    OralTestTaskSchema,
    Task,
    TaskSchema,
    WirdTask,
    WirdTaskSchema,
} from '../../../features/tasks/schemas/task.schema'
import { RefreshToken, RefreshTokenSchema } from '../../../features/tokens/schemas/refresh-token.schema'
import { UserStatus } from '../../../features/users/enums/user-status'
import { User, UserDocument, UserSchema } from '../../../features/users/schemas/user.schema'
import { Counter, CounterSchema } from '../../database-services/schema/counter.schema'
import { DbVersion, DbVersionSchema } from '../../database-services/schema/db-version.schema'
import { ObjectId } from '../../repository/types'

export class MongoTestHelper {
    private mongoServer: MongoMemoryServer
    private mongoConnection: Connection

    private dbVersionModel: Model<DbVersion>
    private userModel: Model<User>
    private verificationCodeModel: Model<VerificationCode>
    private managerModel: Model<Manager>
    private studentModel: Model<Student>
    private counterModel: Model<Counter>
    private refreshTokenModel: Model<RefreshToken>
    private subjectModel: Model<Subject>
    private assigmentModel: Model<Assignment>
    private assigmentResponseModel: Model<AssignmentResponse>
    private lessonModel: Model<Lesson>
    private taskModel: Model<Task>
    private chatModel: Model<Chat>
    private messageModel: Model<Message>
    private programModel: Model<Program>
    private levelModel: Model<Level>
    private subscriptionModel: Model<Subscription>

    static async instance(): Promise<MongoTestHelper> {
        const helper = new MongoTestHelper()
        await helper.initMongoMemoryServer()
        return helper
    }

    get providers(): Provider[] {
        return [
            { provide: getModelToken(Counter.name), useValue: this.getCounterModel() },
            { provide: getModelToken(DbVersion.name), useValue: this.getDbVersionModel() },
            { provide: getModelToken(Assignment.name), useValue: this.getAssignmentModel() },
            { provide: getModelToken(AssignmentResponse.name), useValue: this.getAssignmentResponseModel() },
            { provide: getModelToken(Lesson.name), useValue: this.getLessonModel() },
            { provide: getModelToken(Task.name), useValue: this.getTaskModel() },
            { provide: getModelToken(Chat.name), useValue: this.getChatModel() },
            { provide: getModelToken(Message.name), useValue: this.getMessageModel() },
            { provide: getModelToken(Level.name), useValue: this.getLevelModel() },
            { provide: getModelToken(Program.name), useValue: this.getProgramModel() },
            { provide: getModelToken(Manager.name), useValue: this.getManagerModel() },
            { provide: getModelToken(Subject.name), useValue: this.getSubjectModel() },
            { provide: getModelToken(Student.name), useValue: this.getStudentModel() },
            { provide: getModelToken(RefreshToken.name), useValue: this.getRefreshTokenModel() },
            { provide: getModelToken(Subscription.name), useValue: this.getSubscriptionModel() },
            { provide: getModelToken(User.name), useValue: this.getUserModel() },
            { provide: getModelToken(VerificationCode.name), useValue: this.getVerificationCodeModel() },
        ]
    }

    getDbVersionModel(): Model<DbVersion> {
        if (!this.dbVersionModel) {
            this.dbVersionModel = this.mongoConnection.model(DbVersion.name, DbVersionSchema)
        }
        return this.dbVersionModel
    }

    getRefreshTokenModel(): Model<RefreshToken> {
        if (!this.refreshTokenModel) {
            this.refreshTokenModel = this.mongoConnection.model(RefreshToken.name, RefreshTokenSchema)
        }
        return this.refreshTokenModel
    }

    getUserModel(): Model<User> {
        if (!this.userModel) {
            this.userModel = this.mongoConnection.model(User.name, UserSchema)
        }
        return this.userModel
    }

    getVerificationCodeModel(): Model<VerificationCode> {
        if (!this.verificationCodeModel) {
            this.verificationCodeModel = this.mongoConnection.model(VerificationCode.name, VerificationCodeSchema)
        }
        return this.verificationCodeModel
    }

    getManagerModel(): Model<Manager> {
        if (!this.managerModel) {
            const userModel = this.mongoConnection.model(User.name, UserSchema)
            this.managerModel = userModel.discriminator<Manager>(Manager.name, ManagerSchema)
        }
        return this.managerModel
    }

    getStudentModel(): Model<Student> {
        if (!this.studentModel) {
            const userModel = this.mongoConnection.model(User.name, UserSchema)
            this.studentModel = userModel.discriminator<Student>(Student.name, StudentSchema)
        }
        return this.studentModel
    }

    getCounterModel(): Model<Counter> {
        if (!this.counterModel) {
            this.counterModel = this.mongoConnection.model(Counter.name, CounterSchema)
        }
        return this.counterModel
    }

    getSubjectModel(): Model<Subject> {
        if (!this.subjectModel) {
            this.subjectModel = this.mongoConnection.model(Subject.name, SubjectSchema)
        }
        return this.subjectModel
    }

    getLessonModel(): Model<Lesson> {
        if (!this.lessonModel) {
            this.lessonModel = this.mongoConnection.model(Lesson.name, LessonSchema)
        }
        return this.lessonModel
    }

    getAssignmentModel(): Model<Assignment> {
        if (!this.assigmentModel) {
            this.assigmentModel = this.mongoConnection.model(Assignment.name, AssignmentSchema)
        }
        return this.assigmentModel
    }

    getAssignmentResponseModel(): Model<AssignmentResponse> {
        if (!this.assigmentResponseModel) {
            this.assigmentResponseModel = this.mongoConnection.model(AssignmentResponse.name, AssignmentResponseSchema)
        }
        return this.assigmentResponseModel
    }

    getTaskModel(): Model<Task> {
        if (!this.taskModel) {
            this.taskModel = this.mongoConnection.model(Task.name, TaskSchema)
            this.taskModel.discriminator(LessonTask.name, LessonTaskSchema, TaskType.lesson)
            this.taskModel.discriminator(AssignmentTask.name, AssignmentTaskSchema, TaskType.assignment)
            this.taskModel.discriminator(MeetingTask.name, MeetingTaskSchema, TaskType.meeting)
            this.taskModel.discriminator(WirdTask.name, WirdTaskSchema, TaskType.wird)
            this.taskModel.discriminator(OralTestTask.name, OralTestTaskSchema, TaskType.oralTest)
        }
        return this.taskModel
    }

    getChatModel(): Model<Chat> {
        if (!this.chatModel) {
            this.chatModel = this.mongoConnection.model(Chat.name, ChatSchema)
        }
        return this.chatModel
    }

    getMessageModel(): Model<Message> {
        if (!this.messageModel) {
            this.messageModel = this.mongoConnection.model(Message.name, MessageSchema)
        }
        return this.messageModel
    }

    getProgramModel(): Model<Program> {
        if (!this.programModel) {
            this.programModel = this.mongoConnection.model(Program.name, ProgramSchema)
        }
        return this.programModel
    }

    getLevelModel(): Model<Level> {
        if (!this.levelModel) {
            this.levelModel = this.mongoConnection.model(Level.name, LevelSchema)
        }
        return this.levelModel
    }

    getSubscriptionModel(): Model<Subscription> {
        if (!this.subscriptionModel) {
            this.subscriptionModel = this.mongoConnection.model(Subscription.name, SubscriptionSchema)
        }
        return this.subscriptionModel
    }

    createManager(id: string = ''): Promise<ManagerDocument> {
        const managerDto: SignUpManagerDto = {
            name: 'test manager',
            password: bcrypt.hashSync('testPassword', 10),
            email: `manager${id}@email.com`,
        }
        const model = this.getManagerModel()
        return model.create(managerDto)
    }

    createStudent(id: string = ''): Promise<StudentDocument> {
        const student: Student = {
            name: 'test student',
            password: bcrypt.hashSync('testPassword', 10),
            email: `student${id}@email.com`,
            gender: Gender.male,
            role: Role.Student,
            subscriptions: [],
            status: UserStatus.active,
            phoneNumber: '1234567890',
            country: 'Test Country',
            dateOfBirth: new Date('2000-01-01'),
        }
        const model = this.getStudentModel()
        return model.create(student)
    }

    createUser(): Promise<UserDocument> {
        const user: User = {
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
            status: UserStatus.active,
            role: Role.Manager,
        }
        const model = this.getUserModel()
        return model.create(user)
    }

    async createToken(user: UserDocument): Promise<string> {
        const token: RefreshToken = {
            token: 'test token',
            user,
            createdAt: new Date(),
        }
        const model = this.getRefreshTokenModel()
        await model.create(token)
        return token.token
    }

    async createLesson(createdBy: ObjectId, subjectId: ObjectId = new ObjectId()): Promise<LessonDocument> {
        const lesson: Lesson = {
            url: 'test url',
            state: LessonState.active,
            type: LessonType.video,
            title: 'lesson title',
            createdBy,
            subjectId,
        }
        const model = this.getLessonModel()
        return model.create(lesson)
    }

    async createSubject(createdBy: ObjectId): Promise<SubjectDocument> {
        const subject: Subject = {
            name: 'subject name',
            description: 'subject description',
            createdBy: createdBy,
            lessons: [],
        }
        const model = this.getSubjectModel()
        return model.create(subject)
    }

    async createTask(
        createdBy: ObjectId,
        levelId: ObjectId = new ObjectId(),
        lessons: ObjectId[] = []
    ): Promise<LessonTaskDocument> {
        const task: Partial<LessonTask> = {
            levelId,
            createdBy,
            date: new Date(),
            state: TaskState.active,
            type: TaskType.lesson,
            createdAt: new Date(),
            lessons: lessons.map(({ _id }) => _id),
        }
        const model = this.getTaskModel()
        return model.create(task) as unknown as Promise<LessonTaskDocument>
    }

    async createOralTestTask(
        createdBy: ObjectId,
        levelId: ObjectId = new ObjectId(),
        slots: Partial<OralTestSlot>[] = []
    ): Promise<OralTestTaskDocument> {
        const task: Partial<OralTestTask> = {
            levelId,
            createdBy,
            date: new Date(),
            state: TaskState.active,
            type: TaskType.oralTest,
            createdAt: new Date(),
            title: 'تسميع تجريبي',
            description: 'وصف تجريبي',
            slots: slots as OralTestSlot[],
        }
        const model = this.getTaskModel()
        return model.create(task) as unknown as Promise<OralTestTaskDocument>
    }

    async createProgram(createdBy: ObjectId, levels: ObjectId[] = []): Promise<ProgramDocument> {
        const date = new Date()
        const program: Program = {
            name: 'program name',
            start: new Date(date.valueOf()),
            state: ProgramState.created,
            registrationStart: new Date(date.setMonth(date.getMonth() + 1)),
            registrationEnd: new Date(date.setMonth(date.getMonth() + 2)),
            end: new Date(date.setFullYear(date.getFullYear() + 1)),
            description: 'program description',
            thumbnail: 'test-image.jpg',
            subscriptionType: ProgramSubscriptionType.public,
            levels,
            createdBy,
        }
        const model = this.getProgramModel()
        return model.create(program)
    }

    async createLevel(createdBy: ObjectId, programId: ObjectId = new ObjectId()): Promise<LevelDocument> {
        const date = new Date()
        const level: Level = {
            name: 'level name',
            state: LevelState.active,
            start: new Date(date.valueOf()),
            end: new Date(date.setFullYear(date.getFullYear() + 1)),
            tasks: [],
            createdBy,
            programId,
        }
        const model = this.getLevelModel()
        return model.create(level)
    }

    async createSubscription(programId: ObjectId, levelId: ObjectId, subscriber: ObjectId): Promise<SubscriptionDocument> {
        const subscription: Subscription = {
            program: programId,
            level: levelId,
            subscriber,
            subscriptionDate: new Date(),
            state: SubscriptionState.active,
            notes: 'subscription notes',
            completedTaskIds: [],
            progressPercentage: 0,
        }
        const model = this.getSubscriptionModel()
        return model.create(subscription)
    }

    async createAssignment(createdBy: ObjectId, taskId: ObjectId = new ObjectId()): Promise<AssignmentDocument> {
        const assignment: Assignment = {
            title: 'Assignment Title',
            createdBy,
            taskId,
            gradingState: AssignmentGradingState.pending,
            state: AssignmentState.published,
            type: AssignmentType.exam,
            durationInMinutes: 5,
            passingScore: 10,
            availableFrom: new Date(),
            availableUntil: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        const model = this.getAssignmentModel()
        return model.create(assignment)
    }

    async clearCollections(): Promise<void> {
        const collections = this.mongoConnection.collections
        for (const key in collections) {
            const collection = collections[key]
            await collection.deleteMany({})
        }
    }

    async tearDown(): Promise<void> {
        await this.mongoConnection.dropDatabase()
        await this.mongoConnection.close()
        await this.mongoServer.stop()
    }

    private async initMongoMemoryServer(): Promise<MongoTestHelper> {
        this.mongoServer = await MongoMemoryServer.create()
        const uri = this.mongoServer.getUri()
        this.mongoConnection = (await connect(uri)).connection

        return this
    }
}
