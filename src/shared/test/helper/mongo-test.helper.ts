import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model } from 'mongoose'
import { Manager, ManagerSchema } from '../../../features/managers/schemas/manager.schema'
import { Student, StudentSchema } from '../../../features/students/schemas/student.schema'
import { Subject, SubjectSchema } from '../../../features/subjects/schemas/subject.schema'
import { RefreshToken, RefreshTokenSchema } from '../../../features/tokens/schemas/refresh-token.schema'
import { User, UserSchema } from '../../../features/users/schemas/user.schema'

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
