import * as bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import { Role } from '../../../features/authentication/enums/role.enum'
import { LessonType } from '../../../features/lessons/enums/lesson-type.enum'
import { Lesson, LessonDocument, LessonSchema } from '../../../features/lessons/schemas/lesson.schema'
import { LevelDocument } from '../../../features/levels/schemas/level.schema'
import { SignUpManagerDto } from '../../../features/managers/dto/manager.dto'
import { Manager, ManagerDocument, ManagerSchema } from '../../../features/managers/schemas/manager.schema'
import { ProgramState } from '../../../features/programs/enums/program-state.enum'
import { Program, ProgramDocument, ProgramSchema } from '../../../features/programs/schemas/program.schema'
import { Gender } from '../../../features/students/enums/gender'
import { Student, StudentDocument, StudentSchema } from '../../../features/students/schemas/student.schema'
import { Subject, SubjectDocument, SubjectSchema } from '../../../features/subjects/schemas/subject.schema'
import { Task, TaskDocument, TaskSchema } from '../../../features/tasks/schemas/task.schema'
import { RefreshToken, RefreshTokenSchema } from '../../../features/tokens/schemas/refresh-token.schema'
import { User, UserDocument, UserSchema } from '../../../features/users/schemas/user.schema'

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

    static async instance(): Promise<MongoTestHelper> {
        const helper = new MongoTestHelper()
        await helper.initMongoMemoryServer()
        return helper
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

    createManager(id: string = ''): Promise<ManagerDocument> {
        const managerDto: SignUpManagerDto = {
            name: 'test manager',
            password: bcrypt.hashSync('testPassword', 10),
            email: `manager${id}@email.com`,
        }
        const model = this.getManagerModel()
        return model.create(managerDto)
    }

    createStudent(): Promise<StudentDocument> {
        const studentDto = {
            name: 'test student',
            password: bcrypt.hashSync('testPassword', 10),
            email: 'student@email.com',
            gender: Gender.male,
            role: Role.Student,
        }
        const model = this.getStudentModel()
        return model.create(studentDto)
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

    async createSubject(creator: ManagerDocument, lessons: LessonDocument[]): Promise<SubjectDocument> {
        const subject: Subject = {
            name: 'subject name',
            description: 'subject description',
            createdBy: creator,
            lessons: lessons,
        }
        const model = this.getSubjectModel()
        return model.create(subject)
    }

    async createTask(lessons: LessonDocument[]): Promise<TaskDocument> {
        const task: Task = {
            date: new Date(),
            lessons: lessons.map(({ _id }) => _id),
        }
        const model = this.getTaskModel()
        return model.create(task)
    }

    async createProgram(levels: LevelDocument[]): Promise<ProgramDocument> {
        const date = new Date()
        const program: Program = {
            name: 'program name',
            start: new Date(date.valueOf()),
            state: ProgramState.created,
            registrationStart: new Date(date.setMonth(date.getMonth() + 1)),
            registrationEnd: new Date(date.setMonth(date.getMonth() + 2)),
            end: new Date(date.setFullYear(date.getFullYear() + 1)),
            description: 'program description',
            levels: levels,
        }
        const model = this.getProgramModel()
        return model.create(program)
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
