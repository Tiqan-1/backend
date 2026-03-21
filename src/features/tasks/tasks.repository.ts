import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType, QueryOptions } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { AnyTaskDocument, Task, TaskDocument } from './schemas/task.schema'

@Injectable()
export class TasksRepository extends RepositoryMongoBase<TaskDocument> {
    constructor(@InjectModel(Task.name) model: Model<TaskDocument>) {
        super(model)
    }

    find(filter: object, limit: number = 10, skip: number = 0): Promise<AnyTaskDocument[]> {
        return this.model.find(filter).limit(limit).skip(skip).populate('lessons').populate('assignment').exec() as Promise<
            AnyTaskDocument[]
        >
    }

    findOne(filter: object): Promise<AnyTaskDocument | undefined> {
        return super.findOne(filter) as Promise<AnyTaskDocument | undefined>
    }

    findById(
        id: ObjectId,
        projection?: ProjectionType<TaskDocument>,
        options?: QueryOptions<TaskDocument>
    ): Promise<AnyTaskDocument | undefined> {
        return super.findById(id, projection, options) as Promise<AnyTaskDocument | undefined>
    }

    async update(filter: object, updateElement: object): Promise<AnyTaskDocument | undefined> {
        const result = await this.model
            .findOneAndUpdate({ ...filter }, { $set: { ...updateElement } }, { new: true, strict: false })
            .exec()
        return (result as AnyTaskDocument) ?? undefined
    }
}
