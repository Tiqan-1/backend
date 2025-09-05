import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { I18nService } from 'nestjs-i18n'
import { oneMonth } from '../../shared/constants'
import { CreatedDto } from '../../shared/dto/created.dto'
import { PaginationHelper } from '../../shared/helper/pagination-helper'
import { ObjectId } from '../../shared/repository/types'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { PaginatedProgramDto } from '../programs/dto/paginated-program.dto'
import { SearchStudentProgramQueryDto } from '../programs/dto/program.dto'
import { ProgramState } from '../programs/enums/program-state.enum'
import { ProgramsService } from '../programs/programs.service'
import { PaginatedStudentSubscriptionDto } from '../subscriptions/dto/paginated-subscripition.dto'
import { SearchSubscriptionsQueryDto } from '../subscriptions/dto/search-subscriptions-query.dto'
import { CreateSubscriptionDto, CreateSubscriptionV2Dto, StudentSubscriptionDto } from '../subscriptions/dto/subscription.dto'
import { SubscriptionState } from '../subscriptions/enums/subscription-state.enum'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentStatus } from './enums/student-status'
import { StudentDocument } from './schemas/student.schema'
import { StudentRepository } from './students.repository'

@Injectable()
export class StudentsService {
    private readonly logger = new Logger(StudentsService.name)

    constructor(
        private readonly studentRepository: StudentRepository,
        private readonly authenticationService: AuthenticationService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly programsService: ProgramsService,
        private readonly i18n: I18nService
    ) {}

    async create(student: SignUpStudentDto): Promise<AuthenticationResponseDto> {
        const duplicate = await this.studentRepository.findOne({ email: student.email })
        if (duplicate) {
            this.logger.error(`Manager signup attempt with duplicate email detected: ${duplicate.email}`)
            throw new ConflictException('A user with the same email already exists.')
        }
        try {
            student.password = bcrypt.hashSync(student.password, 10)
            const createdStudent = await this.studentRepository.create({
                ...student,
                role: Role.Student,
                status: StudentStatus.active,
            })
            return this.authenticationService.generateUserTokens(createdStudent)
        } catch (error) {
            this.logger.error('Error while creating user', error)
            throw new InternalServerErrorException('General Error while creating student.')
        }
    }

    async subscribe(createSubscriptionDto: CreateSubscriptionDto, studentId: ObjectId): Promise<CreatedDto> {
        const student = await this.loadStudent(studentId)
        return await this.subscriptionsService.create(createSubscriptionDto, student)
    }

    async subscribeV2(createSubscriptionDto: CreateSubscriptionV2Dto, studentId: ObjectId): Promise<CreatedDto> {
        const student = await this.loadStudent(studentId)
        return await this.subscriptionsService.createV2(createSubscriptionDto, student)
    }

    async suspendSubscription(subscriptionId: string, studentId: ObjectId): Promise<void> {
        const subscriptionObjectId = new ObjectId(subscriptionId)
        const student = await this.loadStudent(studentId)
        const hasSubscription = (student.subscriptions as ObjectId[]).includes(subscriptionObjectId)
        if (!hasSubscription) {
            throw new NotFoundException('Student does not have subscription with the given id.')
        }
        await this.subscriptionsService.update(subscriptionId, { state: SubscriptionState.suspended })
        this.logger.log(`Student ${student.email} suspended subscription ${subscriptionId}.`)
    }

    async findSubscriptions(query: SearchSubscriptionsQueryDto, studentId: ObjectId): Promise<PaginatedStudentSubscriptionDto> {
        query.subscriberId = studentId
        const state = query.state && query.state !== SubscriptionState.pending ? query.state : { $ne: SubscriptionState.pending }
        const { found, total } = await this.subscriptionsService.findRaw({ ...query, state })
        return PaginationHelper.wrapResponse(StudentSubscriptionDto.fromDocuments(found), query.page, query.pageSize, total)
    }

    async remove(id: ObjectId): Promise<void> {
        const student = await this.studentRepository.findById(id)
        if (!student) {
            throw new InternalServerErrorException('Student not found.')
        }
        await student.updateOne({ status: StudentStatus.deleted, expireAt: oneMonth })
        this.logger.log(`student with id ${id.toString()} was marked as deleted and will be removed in 30 days.`)
        for (const subscription of student.subscriptions) {
            await this.subscriptionsService.remove(subscription._id.toString())
        }
        await student.save()
        this.logger.log(`Student ${student.email} closed his account.`)
    }

    async removeSubscription(subscriptionId: string, studentId: ObjectId): Promise<void> {
        const student = await this.loadStudent(studentId)
        const indexOfSubscription = student.subscriptions.findIndex(id => id._id.toString() === subscriptionId)
        if (indexOfSubscription === -1) {
            throw new NotFoundException('Student does not have subscription with the given id.')
        }
        ;(student.subscriptions as ObjectId[]).splice(indexOfSubscription, 1)
        await student.save()
        await this.subscriptionsService.remove(subscriptionId)
        this.logger.log(`Student ${student.email} removed subscription ${subscriptionId}.`)
    }

    findPrograms(query: SearchStudentProgramQueryDto): Promise<PaginatedProgramDto> {
        query.state = query.state ?? ProgramState.published
        return this.programsService.find(query)
    }

    findProgramsV3(query: SearchStudentProgramQueryDto): Promise<PaginatedProgramDto> {
        query.state = query.state ?? ProgramState.published
        const extraFilers = new Map<string, unknown>()
        if (query.openForRegistration) {
            extraFilers.set('registrationStart', { $lte: new Date() })
            extraFilers.set('registrationEnd', { $gt: new Date() })
        }
        return this.programsService.find(query, undefined, extraFilers)
    }

    private async loadStudent(studentId: ObjectId): Promise<StudentDocument> {
        const student = await this.studentRepository.findById(studentId)
        if (!student || student.status === StudentStatus.deleted) {
            this.logger.error(`Trying to load student ${studentId.toString()} from session but not found in the database.`)
            throw new InternalServerErrorException(
                this.i18n.t('student.subscriptions.createSubscription.errors.INTERNAL_SERVER_ERROR')
            )
        }
        return student
    }
}
