import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Task, TaskDocument } from './schemas/task.schema'

@Injectable()
export class TasksRepository extends RepositoryMongoBase<TaskDocument> {
    constructor(@InjectModel(Task.name) model: Model<TaskDocument>) {
        super(model)
    }

    find(filter: object, limit: number = 10, skip: number = 0): Promise<TaskDocument[]> {
        return this.model.find(filter).limit(limit).skip(skip).populate('lessons').exec()
    }

    create(element: unknown): Promise<TaskDocument> {
        return super.create(element)
    }
}
