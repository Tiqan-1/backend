import * as bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import { Lesson, LessonSchema } from '../../../features/lessons/schemas/lesson.schema'
import { SignUpManagerDto } from '../../../features/managers/dto/manager.dto'
import { Manager, ManagerDocument, ManagerSchema } from '../../../features/managers/schemas/manager.schema'
import { Student, StudentSchema } from '../../../features/students/schemas/student.schema'
import { Subject, SubjectSchema } from '../../../features/subjects/schemas/subject.schema'
import { RefreshToken, RefreshTokenSchema } from '../../../features/tokens/schemas/refresh-token.schema'
import { User, UserDocument, UserSchema } from '../../../features/users/schemas/user.schema'
import { Role } from '../../enums/role.enum'

export class MongoTestHelper {
    private mongoServer: MongoMemoryServer
    private mongoConnection: Connection

    static async instance(): Promise<MongoTestHelper> {
        const helper = new MongoTestHelper()
        await helper.initMongoMemoryServer()
        return helper
    }

    initRefreshToken(): Model<RefreshToken> {
        return this.mongoConnection.model(RefreshToken.name, RefreshTokenSchema)
    }

    initUser(): Model<User> {
        return this.mongoConnection.model(User.name, UserSchema)
    }

    initManager(): Model<Manager> {
        const userModel = this.mongoConnection.model(User.name, UserSchema)
        return userModel.discriminator<Manager>(Manager.name, ManagerSchema)
    }

    initStudent(): Model<Student> {
        const userModel = this.mongoConnection.model(User.name, UserSchema)
        return userModel.discriminator<Student>(Student.name, StudentSchema)
    }

    initSubject(): Model<Subject> {
        return this.mongoConnection.model(Subject.name, SubjectSchema)
    }

    initLesson(): Model<Lesson> {
        return this.mongoConnection.model(Lesson.name, LessonSchema)
    }

    createManager(): Promise<ManagerDocument> {
        const managerDto: SignUpManagerDto = {
            name: 'test manager',
            password: 'test password',
            email: 'manager@email.com',
        }
        const model = this.initManager()
        return model.create(managerDto)
    }

    createUser(): Promise<UserDocument> {
        const user: User = {
            name: 'test user',
            email: 'testUser@gmail.com',
            password: bcrypt.hashSync('testPassword', 10),
            role: Role.Manager,
        }
        const model = this.initUser()
        return model.create(user)
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
