import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, ProjectionType, QueryOptions } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { ObjectId } from '../../shared/repository/types'
import { TaskState, TaskType } from './enums'
import { AnyTaskDocument, OralTestTaskDocument, Task, TaskDocument } from './schemas/task.schema'

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

    async findOralTestById(id: ObjectId, opts?: { populateBookings?: boolean }): Promise<OralTestTaskDocument | undefined> {
        let q = this.model.findOne({ _id: id, type: TaskType.oralTest, state: { $ne: TaskState.deleted } })
        if (opts?.populateBookings) q = q.populate('slots.bookedBy')
        return ((await q.exec()) as OralTestTaskDocument | null) ?? undefined
    }

    async findOralTestByIdAndOwner(
        id: ObjectId,
        managerId: ObjectId,
        opts?: { populateBookings?: boolean }
    ): Promise<OralTestTaskDocument | undefined> {
        let q = this.model.findOne({
            _id: id,
            createdBy: managerId,
            type: TaskType.oralTest,
            state: { $ne: TaskState.deleted },
        })
        if (opts?.populateBookings) q = q.populate('slots.bookedBy')
        return ((await q.exec()) as OralTestTaskDocument | null) ?? undefined
    }

    async bookSlotAtomically(
        taskId: ObjectId,
        slotId: ObjectId,
        studentId: ObjectId,
        subscriptionId: ObjectId
    ): Promise<boolean> {
        const result = await this.model.updateOne(
            {
                _id: taskId,
                type: TaskType.oralTest,
                state: { $ne: TaskState.deleted },
                slots: { $elemMatch: { _id: slotId, bookedBy: { $in: [null, undefined] } } },
            },
            {
                $set: {
                    'slots.$.bookedBy': studentId,
                    'slots.$.bookedAt': new Date(),
                    'slots.$.bookedSubscriptionId': subscriptionId,
                },
            }
        )
        return result.modifiedCount === 1
    }

    async cancelBookingAtomically(taskId: ObjectId, slotId: ObjectId, managerId: ObjectId, reason?: string): Promise<boolean> {
        const setOps: Record<string, unknown> = {
            'slots.$.cancelledBy': managerId,
            'slots.$.cancelledAt': new Date(),
        }
        if (reason !== undefined) setOps['slots.$.cancellationReason'] = reason
        const result = await this.model.updateOne(
            {
                _id: taskId,
                createdBy: managerId,
                type: TaskType.oralTest,
                state: { $ne: TaskState.deleted },
                'slots._id': slotId,
            },
            {
                $set: setOps,
                $unset: {
                    'slots.$.bookedBy': '',
                    'slots.$.bookedAt': '',
                    'slots.$.bookedSubscriptionId': '',
                },
            }
        )
        return result.modifiedCount === 1
    }

    async setSlotGradeAtomically(taskId: ObjectId, slotId: ObjectId, grade: number, feedback?: string): Promise<boolean> {
        const setOps: Record<string, unknown> = {
            'slots.$.grade': grade,
            'slots.$.gradedAt': new Date(),
        }
        if (feedback !== undefined) setOps['slots.$.feedback'] = feedback
        const result = await this.model.updateOne(
            {
                _id: taskId,
                type: TaskType.oralTest,
                state: { $ne: TaskState.deleted },
                'slots._id': slotId,
            },
            { $set: setOps }
        )
        return result.modifiedCount === 1
    }
}
