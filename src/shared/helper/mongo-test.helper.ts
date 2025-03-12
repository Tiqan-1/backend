import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model, Schema } from 'mongoose'

export class MongoTestHelper {
    private mongoServer: MongoMemoryServer
    private mongoConnection: Connection

    static async instance(): Promise<MongoTestHelper> {
        const helper = new MongoTestHelper()
        await helper.initMongoMemoryServer()
        return helper
    }

    initModel(name: string, schema: Schema): Model<unknown> {
        return this.mongoConnection.model(name, schema) as Model<unknown>
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
