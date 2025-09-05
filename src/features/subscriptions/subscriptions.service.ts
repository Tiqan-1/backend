import { ConflictException, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { ProgramState } from '../programs/enums/program-state.enum'
import { ProgramSubscriptionType } from '../programs/enums/program-subscription-type.enum'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { StudentDocument } from '../students/schemas/student.schema'
import { PaginatedSubscriptionDto } from './dto/paginated-subscripition.dto'
import { SearchSubscriptionsQueryDto } from './dto/search-subscriptions-query.dto'
import {
    CreateSubscriptionDto,
    CreateSubscriptionV2Dto,
    StudentSubscriptionDto,
    SubscriptionDto,
    UpdateSubscriptionDto,
} from './dto/subscription.dto'
import { SubscriptionState } from './enums/subscription-state.enum'
import { SubscriptionDocument } from './schemas/subscription.schema'
import { SubscriptionsRepository } from './subscriptions.repository'

type FoundSubscriptions = { found: SubscriptionDocument[]; total: number }

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name)

    constructor(
        private readonly repository: SubscriptionsRepository,
        private readonly sharedDocumentsService: SharedDocumentsService,
        private readonly i18n: I18nService
    ) {}

    async create(createSubscriptionDto: CreateSubscriptionDto, student: StudentDocument): Promise<CreatedDto> {
        const { programId, levelId } = createSubscriptionDto
        const currentSubscriptions = await this.getManyForStudent(student.subscriptions as ObjectId[])
        const program = await this.sharedDocumentsService.getProgram(programId)

        this.validateSubscriptionForStudent(currentSubscriptions, program)

        const state =
            program?.subscriptionType === ProgramSubscriptionType.public ? SubscriptionState.active : SubscriptionState.pending

        const created = await this.repository.create({ program: programId, level: levelId, subscriber: student._id, state })
        ;(student.subscriptions as ObjectId[]).push(created._id)
        await student.save()
        this.logger.log(`Student ${student.email} subscribed to program ${createSubscriptionDto.programId}
         in level ${createSubscriptionDto.levelId}. Subscription: ${created._id.toString()}.`)
        return { id: created._id.toString() }
    }

    async createV2(createSubscriptionDto: CreateSubscriptionV2Dto, student: StudentDocument): Promise<CreatedDto> {
        const { programId } = createSubscriptionDto
        const currentSubscriptions = await this.getManyForStudent(student.subscriptions as ObjectId[])
        const program = await this.sharedDocumentsService.getProgram(programId)

        this.validateSubscriptionForStudent(currentSubscriptions, program)

        const state =
            program?.subscriptionType === ProgramSubscriptionType.public ? SubscriptionState.active : SubscriptionState.pending

        const created = await this.repository.create({ program: program?._id, subscriber: student._id, state })
        ;(student.subscriptions as ObjectId[]).push(created._id)
        await student.save()
        this.logger.log(
            `Student ${student.email} subscribed to program ${createSubscriptionDto.programId}. Subscription: ${created._id.toString()}.`
        )
        return { id: created._id.toString() }
    }

    async findRaw(query: Omit<SearchSubscriptionsQueryDto, 'state'> & { state?: unknown }): Promise<FoundSubscriptions> {
        const { programId, levelId, subscriberId } = query
        const queryBuilder = SearchFilterBuilder.init()
        let programLevels: ObjectId[] = []
        if (programId) {
            const program = await this.sharedDocumentsService.getProgram(programId.toString())
            if (!program?.levels.length) {
                this.logger.debug(`Program ${programId.toString()} not found or has no levels.`)
                return { found: [], total: 0 }
            }
            programLevels = program.levels as ObjectId[]
            queryBuilder.withObjectId('program', program._id)
        }
        if (levelId) {
            if (programLevels.length && !programLevels.includes(levelId)) {
                this.logger.debug(`level ${levelId.toString()} not found.`)
                return { found: [], total: 0 }
            }
            const level = await this.sharedDocumentsService.getLevel(levelId.toString())
            if (!level) {
                this.logger.debug(`level ${levelId.toString()} not found.`)
                return { found: [], total: 0 }
            }
            queryBuilder.withObjectId('level', level._id)
        }
        if (subscriberId) {
            const subscriber = await this.sharedDocumentsService.getStudent(subscriberId.toString())
            if (!subscriber) {
                this.logger.debug(`subscriber ${subscriberId.toString()} not found.`)
                return { found: [], total: 0 }
            }
            queryBuilder.withObjectId('subscriber', subscriber._id)
        }

        queryBuilder
            .withObjectId('_id', query.id)
            .withDate('subscriptionDate', query.subscriptionDate)
            .withParam('state', query.state)
            .withStringLike('notes', query.notes)

        const filter = queryBuilder.build()
        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.repository.find(filter, query.pageSize, skip),
            await this.repository.countDocuments(filter),
        ])
        return { found, total }
    }

    async find(query: SearchSubscriptionsQueryDto, managerId: ObjectId): Promise<PaginatedSubscriptionDto> {
        const { found, total } = await this.findRaw(query)
        const filtered = found.filter(sub => (sub.program as ProgramDocument).createdBy._id.equals(managerId))
        return PaginationHelper.wrapResponse(SubscriptionDto.fromDocuments(filtered), query.page, query.pageSize, total)
    }

    async approve(id: ObjectId, managerId: ObjectId): Promise<void> {
        const found = await this.repository.findById(id)
        if (!found) {
            throw new NotFoundException(`Subscription with id ${id.toString()} not found.`)
        }
        if (found.state !== SubscriptionState.pending) {
            throw new ConflictException(`Subscription with id ${id.toString()} is not pending for approval.`)
        }
        const createdBy = (found.program as ProgramDocument).createdBy as ObjectId
        if (!createdBy.equals(managerId)) {
            throw new NotAcceptableException(`Current manager is not allowed to edit subscription ${id.toString()}.`)
        }
        found.state = SubscriptionState.active
        await found.save()
    }

    findWithProgramIdsAndSubscriber(
        programIds: ObjectId[] | string[],
        subscriberId: ObjectId,
        state: SubscriptionState
    ): Promise<SubscriptionDocument[]> {
        const query = SearchFilterBuilder.init()
            .withObjectIds('program', programIds)
            .withObjectId('subscriber', subscriberId)
            .withParam('state', state)
            .build()

        return this.repository.findRaw(query)
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
        this.logger.log(`subscription with id ${id} was marked as deleted and will be removed in 30 days.`)
    }

    async getManyForStudent(subscriptionIds: ObjectId[], limit?: number, skip?: number): Promise<StudentSubscriptionDto[]> {
        const subscriptions: SubscriptionDocument[] = await this.repository.findManyByIds(subscriptionIds, limit, skip)
        return StudentSubscriptionDto.fromDocuments(subscriptions)
    }

    validateSubscriptionForStudent(currentSubscriptions: StudentSubscriptionDto[], program?: ProgramDocument): void {
        if (!program) {
            this.logger.error(`Program not found.`)
            throw new NotFoundException(this.i18n.t('student.subscriptions.createSubscription.errors.NOT_FOUND'))
        }
        const programId = program._id.toString()
        const hasSameSubscription = currentSubscriptions?.some(sub => sub.program.id === programId)
        if (hasSameSubscription) {
            this.logger.error(`Student already subscribed to program ${programId}.`)
            throw new ConflictException(this.i18n.t('student.subscriptions.createSubscription.errors.CONFLICT'))
        }

        if (program.state !== ProgramState.published || program.levels?.length === 0) {
            this.logger.error(`Program state invalid for subscribing.`)
            throw new NotAcceptableException(this.i18n.t('student.subscriptions.createSubscription.errors.NOT_ACCEPTABLE'))
        }

        const now = Date.now()
        if (program.registrationStart.getTime() > now || program.registrationEnd.getTime() < now) {
            this.logger.error(`Program registration period is not active.`)
            throw new NotAcceptableException(this.i18n.t('student.subscriptions.createSubscription.errors.NOT_ACCEPTABLE'))
        }
    }
}
