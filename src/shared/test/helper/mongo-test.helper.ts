import { Provider } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'
import * as bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import { Role } from '../../../features/authentication/enums/role.enum'
import { LessonType } from '../../../features/lessons/enums/lesson-type.enum'
import { Lesson, LessonDocument, LessonSchema } from '../../../features/lessons/schemas/lesson.schema'
import { Level, LevelDocument, LevelSchema } from '../../../features/levels/schemas/level.schema'
import { SignUpManagerDto } from '../../../features/managers/dto/manager.dto'
import { Manager, ManagerDocument, ManagerSchema } from '../../../features/managers/schemas/manager.schema'
import { ProgramState } from '../../../features/programs/enums/program-state.enum'
import { Program, ProgramDocument, ProgramSchema } from '../../../features/programs/schemas/program.schema'
import { Gender } from '../../../features/students/enums/gender'
import { Student, StudentDocument, StudentSchema } from '../../../features/students/schemas/student.schema'
import { Subject, SubjectDocument, SubjectSchema } from '../../../features/subjects/schemas/subject.schema'
import { State } from '../../../features/subscriptions/enums/state.enum'
import {
    Subscription,
    SubscriptionDocument,
    SubscriptionSchema,
} from '../../../features/subscriptions/schemas/subscription.schema'
import { Task, TaskDocument, TaskSchema } from '../../../features/tasks/schemas/task.schema'
import { RefreshToken, RefreshTokenSchema } from '../../../features/tokens/schemas/refresh-token.schema'
import { User, UserDocument, UserSchema } from '../../../features/users/schemas/user.schema'
import { ObjectId } from '../../repository/types'

export class MongoTestHelper {
    private mongoServer: MongoMemoryServer
    private mongoConnection: Connection

    private userModel: Model<User>
    private managerModel: Model<Manager>
    private studentModel: Model<Student>
    private refreshTokenModel: Model<RefreshToken>
    private subjectModel: Model<Subject>
    private lessonModel: Model<Lesson>
    private taskModel: Model<Task>
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
            { provide: getModelToken(Lesson.name), useValue: this.getLessonModel() },
            { provide: getModelToken(Task.name), useValue: this.getTaskModel() },
            { provide: getModelToken(Level.name), useValue: this.getLevelModel() },
            { provide: getModelToken(Program.name), useValue: this.getProgramModel() },
            { provide: getModelToken(Manager.name), useValue: this.getManagerModel() },
            { provide: getModelToken(Subject.name), useValue: this.getSubjectModel() },
            { provide: getModelToken(Student.name), useValue: this.getStudentModel() },
            { provide: getModelToken(RefreshToken.name), useValue: this.getRefreshTokenModel() },
            { provide: getModelToken(Subscription.name), useValue: this.getSubscriptionModel() },
            { provide: getModelToken(User.name), useValue: this.getUserModel() },
        ]
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

    getTaskModel(): Model<Task> {
        if (!this.taskModel) {
            this.taskModel = this.mongoConnection.model(Task.name, TaskSchema)
        }
        return this.taskModel
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

    createStudent(subscriptionIds: ObjectId[] = []): Promise<StudentDocument> {
        const student: Student = {
            name: 'test student',
            password: bcrypt.hashSync('testPassword', 10),
            email: 'student@email.com',
            gender: Gender.male,
            role: Role.Student,
            subscriptions: subscriptionIds,
        }
        const model = this.getStudentModel()
        return model.create(student)
    }

    createUser(): Promise<UserDocument> {
        const user: User = {
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
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

    async createLesson(): Promise<LessonDocument> {
        const lesson: Lesson = {
            url: 'test url',
            type: LessonType.Video,
            title: 'lesson title',
        }
        const model = this.getLessonModel()
        return model.create(lesson)
    }

    async createSubject(lessons: ObjectId[], createdBy: ObjectId): Promise<SubjectDocument> {
        const subject: Subject = {
            name: 'subject name',
            description: 'subject description',
            createdBy: createdBy,
            lessons: lessons,
        }
        const model = this.getSubjectModel()
        return model.create(subject)
    }

    async createTask(lessons: ObjectId[]): Promise<TaskDocument> {
        const task: Task = {
            date: new Date(),
            lessons: lessons.map(({ _id }) => _id),
        }
        const model = this.getTaskModel()
        return model.create(task)
    }

    async createProgram(levels: ObjectId[], createdBy: ObjectId): Promise<ProgramDocument> {
        const date = new Date()
        const program: Program = {
            name: 'program name',
            start: new Date(date.valueOf()),
            state: ProgramState.created,
            registrationStart: new Date(date.setMonth(date.getMonth() + 1)),
            registrationEnd: new Date(date.setMonth(date.getMonth() + 2)),
            end: new Date(date.setFullYear(date.getFullYear() + 1)),
            description: 'program description',
            levels,
            createdBy,
        }
        const model = this.getProgramModel()
        return model.create(program)
    }

    async createLevel(tasks: ObjectId[]): Promise<LevelDocument> {
        const date = new Date()
        const level: Level = {
            name: 'level name',
            start: new Date(date.valueOf()),
            end: new Date(date.setFullYear(date.getFullYear() + 1)),
            tasks: tasks,
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
            state: State.active,
            notes: 'subscription notes',
        }
        const model = this.getSubscriptionModel()
        return model.create(subscription)
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
