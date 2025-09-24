import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { VerificationCode, VerificationCodeDocument } from '../../features/authentication/schema/verification-code.schema'
import { Lesson, LessonDocument } from '../../features/lessons/schemas/lesson.schema'
import { Level, LevelDocument } from '../../features/levels/schemas/level.schema'
import { Manager, ManagerDocument } from '../../features/managers/schemas/manager.schema'
import { Program, ProgramDocument } from '../../features/programs/schemas/program.schema'
import { Student, StudentDocument } from '../../features/students/schemas/student.schema'
import { Subject, SubjectDocument } from '../../features/subjects/schemas/subject.schema'
import { Subscription, SubscriptionDocument } from '../../features/subscriptions/schemas/subscription.schema'
import { Task, TaskDocument } from '../../features/tasks/schemas/task.schema'
import { User, UserDocument } from '../../features/users/schemas/user.schema'
import { ObjectId } from '../repository/types'
import { DbVersion, DbVersionDocument } from './schema/db-version.schema'

@Injectable()
export class SharedDocumentsService {
    constructor(
        @InjectModel(DbVersion.name) private dbVersion: Model<DbVersionDocument>,
        @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
        @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
        @InjectModel(Manager.name) private managerModel: Model<ManagerDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
        @InjectModel(Level.name) private levelModel: Model<LevelDocument>,
        @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
        @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>
    ) {}

    async getDbVersion(): Promise<DbVersionDocument> {
        return (await this.dbVersion.findOne().exec()) ?? (await this.dbVersion.create({}))
    }

    async getLesson(id: string): Promise<LessonDocument | undefined> {
        return this.getDocument<LessonDocument>(id, this.lessonModel)
    }

    async getLessons(ids: string[]): Promise<LessonDocument[]> {
        return this.getDocuments<LessonDocument>(ids, this.lessonModel)
    }

    async getSubject(id: string): Promise<SubjectDocument | undefined> {
        return this.getDocument<SubjectDocument>(id, this.subjectModel)
    }

    async getSubjects(ids: string[]): Promise<SubjectDocument[]> {
        return this.getDocuments<SubjectDocument>(ids, this.subjectModel)
    }

    async getManager(id: string): Promise<ManagerDocument | undefined> {
        return this.getDocument<ManagerDocument>(id, this.managerModel)
    }

    async getManagers(ids: string[]): Promise<ManagerDocument[]> {
        return this.getDocuments<ManagerDocument>(ids, this.managerModel)
    }

    async getStudent(id: string): Promise<StudentDocument | undefined> {
        return this.getDocument<StudentDocument>(id, this.studentModel)
    }

    async getStudentByEmail(email: string): Promise<StudentDocument | undefined> {
        const found = await this.studentModel.findOne({ email }).exec()
        if (!found) {
            return undefined
        }
        return found
    }

    async getStudents(ids: string[]): Promise<StudentDocument[]> {
        return this.getDocuments<StudentDocument>(ids, this.studentModel)
    }

    getUser(id: string): Promise<UserDocument | undefined> {
        return this.getDocument<UserDocument>(id, this.userModel)
    }

    async getTask(id: string): Promise<TaskDocument | undefined> {
        return this.getDocument<TaskDocument>(id, this.taskModel)
    }

    async getTasks(ids: string[]): Promise<TaskDocument[]> {
        return this.getDocuments<TaskDocument>(ids, this.taskModel)
    }

    async getLevel(id: string): Promise<LevelDocument | undefined> {
        return this.getDocument<LevelDocument>(id, this.levelModel)
    }

    async getLevels(ids: string[]): Promise<LevelDocument[]> {
        return this.getDocuments<LevelDocument>(ids, this.levelModel)
    }

    async getProgram(id: string): Promise<ProgramDocument | undefined> {
        return this.getDocument<ProgramDocument>(id, this.programModel)
    }

    async getPrograms(ids: string[]): Promise<ProgramDocument[]> {
        return this.getDocuments<ProgramDocument>(ids, this.programModel)
    }

    async getSubscription(id: string): Promise<SubscriptionDocument | undefined> {
        return this.getDocument<SubscriptionDocument>(id, this.subscriptionModel)
    }

    async getSubscriptions(ids: string[]): Promise<SubscriptionDocument[]> {
        return this.getDocuments<SubscriptionDocument>(ids, this.subscriptionModel)
    }

    private async getDocument<T>(id: string, model: Model<T>): Promise<T | undefined> {
        const found = await model.findById(new ObjectId(id)).exec()
        if (!found) {
            return undefined
        }
        return found
    }

    private async getDocuments<T>(ids: string[], model: Model<T>): Promise<T[]> {
        const objectIds = ids.map(id => new ObjectId(id))
        let found: T[]
        if (objectIds.length > 0) {
            found = await model.find({ _id: { $in: objectIds } }).exec()
        } else {
            found = await model.find({}).exec()
        }
        return found
    }
}
