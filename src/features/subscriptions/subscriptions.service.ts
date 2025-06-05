import { ConflictException, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { oneMonth } from '../../shared/constants'
import { SharedDocumentsService } from '../../shared/database-services/shared-documents.service'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { SearchFilterBuilder } from '../../shared/helper/search-filter.builder'
import { ObjectId } from '../../shared/repository/types'
import { LevelState } from '../levels/enums/level-stats.enum'
import { LevelDocument } from '../levels/schemas/level.schema'
import { ProgramState } from '../programs/enums/program-state.enum'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { StudentDocument } from '../students/schemas/student.schema'
import { PaginatedSubscriptionDto } from './dto/paginated-subscripition.dto'
import { SearchSubscriptionsQueryDto } from './dto/search-subscriptions-query.dto'
import { CreateSubscriptionDto, StudentSubscriptionDto, SubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto'
import { SubscriptionState } from './enums/subscription-state.enum'
import { SubscriptionDocument } from './schemas/subscription.schema'
import { SubscriptionsRepository } from './subscriptions.repository'

type FoundSubscriptions = { found: SubscriptionDocument[]; total: number }

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name)

    constructor(
        private readonly repository: SubscriptionsRepository,
        private readonly sharedDocumentsService: SharedDocumentsService
    ) {}

    async create(createSubscriptionDto: CreateSubscriptionDto, student: StudentDocument): Promise<CreatedDto> {
        const { programId, levelId } = createSubscriptionDto
        const currentSubscriptions = await this.getManyForStudent(student.subscriptions as ObjectId[])
        const program = await this.sharedDocumentsService.getProgram(programId)
        const level = await this.sharedDocumentsService.getLevel(levelId)

        this.validateSubscriptionForStudent(currentSubscriptions, program, level)

        const created = await this.repository.create({ program: programId, level: levelId, subscriber: student._id })
        ;(student.subscriptions as ObjectId[]).push(created._id)
        await student.save()
        this.logger.log(`Student ${student.email} subscribed to program ${createSubscriptionDto.programId}
         in level ${createSubscriptionDto.levelId}. Subscription: ${created._id.toString()}.`)
        return { id: created._id.toString() }
    }

    async findRaw(query: SearchSubscriptionsQueryDto): Promise<FoundSubscriptions> {
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
            .withExactString('state', query.state)
            .withStringLike('notes', query.notes)

        const filter = queryBuilder.build()
        const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)

        const [found, total] = await Promise.all([
            await this.repository.find(filter, query.pageSize, skip),
            await this.repository.countDocuments(filter),
        ])
        return { found, total }
    }

    async find(query: SearchSubscriptionsQueryDto): Promise<PaginatedSubscriptionDto> {
        const { found, total } = await this.findRaw(query)
        return PaginationHelper.wrapResponse(SubscriptionDto.fromDocuments(found), query.page, query.pageSize, total)
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

    validateSubscriptionForStudent(
        currentSubscriptions: StudentSubscriptionDto[],
        program: ProgramDocument,
        level: LevelDocument
    ): void {
        const programId = program._id.toString()
        const levelId = level._id.toString()
        const hasSameSubscription = currentSubscriptions?.some(
            sub => sub.program.id === programId && sub.level.id === levelId && sub.state !== SubscriptionState.deleted
        )
        if (hasSameSubscription) {
            this.logger.error(`Student already subscribed to level ${levelId} in program ${programId}.`)
            throw new ConflictException('Student already have the same subscription.')
        }

        if (!program || !level) {
            this.logger.error(`Program ${programId} or level ${levelId} not found.`)
            throw new NotFoundException('Program or level not found.')
        }
        const programLevels = program.levels as ObjectId[]
        if (!programLevels.includes(level._id)) {
            this.logger.error(`Level ${levelId} not found in program ${programId}.`)
            throw new NotFoundException('Level not found in program.')
        }

        if (program.state !== ProgramState.published || level.state !== LevelState.active) {
            this.logger.error(`Program or level state invalid for subscribing.`)
            throw new NotAcceptableException('Program or level state invalid for subscribing.')
        }

        const now = Date.now()
        if (program.registrationStart.getTime() > now || program.registrationEnd.getTime() < now) {
            this.logger.error(`Program registration period is not active.`)
            throw new NotAcceptableException('Program registration period is not active.')
        }

        if (level.start.getTime() > now || level.end.getTime() < now) {
            this.logger.error(`Level registration period is not active.`)
            throw new NotAcceptableException('Level registration period is not active.')
        }
    }
}
