import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/documents-validator/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { ObjectId } from '../../shared/repository/types'
import { LevelDocument } from '../levels/schemas/level.schema'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { CreateSubscriptionDto, StudentSubscriptionDto, SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto'
import { SubscriptionState } from './enums/subscription-state.enum'
import { SubscriptionDocument } from './schemas/subscription.schema'
import { SubscriptionsRepository } from './subscriptions.repository'

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name)

    constructor(
        private readonly repository: SubscriptionsRepository,
        private readonly sharedDocumentsService: SharedDocumentsService
    ) {}

    async create(createSubscriptionDto: CreateSubscriptionDto, subscriber: ObjectId): Promise<CreatedDto> {
        const program = (await this.sharedDocumentsService.getProgram(createSubscriptionDto.programId)) as ProgramDocument
        const level = (await this.sharedDocumentsService.getLevel(createSubscriptionDto.levelId)) as LevelDocument
        const createdObject = await this.repository.create({ program: program._id, level: level._id, subscriber })
        return { id: createdObject._id.toString() }
    }

    async findAll(limit?: number, skip?: number): Promise<SubscriptionDto[]> {
        const found = await this.repository.findAll(limit, skip)
        return SubscriptionDto.fromDocuments(found)
    }

    async findOne(id: string): Promise<SubscriptionDto> {
        const found = await this.repository.findByIdPopulated(new ObjectId(id))
        if (!found) {
            throw new NotFoundException(`Subscription with id ${id} not found.`)
        }
        return SubscriptionDto.fromDocument(found)
    }

    async update(id: string, updateObject: UpdateSubscriptionDto): Promise<void> {
        await this.repository.update({ _id: new ObjectId(id) }, updateObject)
    }

    async remove(id: string): Promise<void> {
        const found = await this.repository.update(
            { _id: new ObjectId(id) },
            { state: SubscriptionState.deleted, expireAt: oneMonth }
        )
        if (!found) {
            throw new NotFoundException(`Subscription with id ${id} not found.`)
        }
        this.logger.debug(`subscription with id ${id} was marked as deleted and will be removed in 30 days.`)
    }

    async getManyForStudent(subscriptionIds: ObjectId[], limit?: number, skip?: number): Promise<StudentSubscriptionDto[]> {
        const subscriptions: SubscriptionDocument[] = await this.repository.findManyByIdsPopulated(subscriptionIds, limit, skip)
        return StudentSubscriptionDto.fromDocuments(subscriptions)
    }
}
