import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { CreatedDto } from '../../shared/dto/created.dto'
import { HandleBsonErrors } from '../../shared/errors/error-handler'
import { ObjectId } from '../../shared/repository/types'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { StudentProgramDto } from '../programs/dto/program.dto'
import { ProgramsService } from '../programs/programs.service'
import { CreateSubscriptionDto, StudentSubscriptionDto } from '../subscriptions/dto/subscription.dto'
import { State } from '../subscriptions/enums/state.enum'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentDocument } from './schemas/student.schema'
import { StudentRepository } from './students.repository'

@Injectable()
export class StudentsService {
    constructor(
        private readonly studentRepository: StudentRepository,
        private readonly authenticationService: AuthenticationService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly programsService: ProgramsService
    ) {}

    async create(student: SignUpStudentDto): Promise<AuthenticationResponseDto> {
        const duplicate = await this.studentRepository.findOne({ email: student.email })
        if (duplicate) {
            throw new ConflictException('A user with the same email already exists.')
        }
        try {
            student.password = bcrypt.hashSync(student.password, 10)
            const createdStudent = await this.studentRepository.create({ ...student, role: Role.Student })
            return this.authenticationService.generateUserTokens(createdStudent)
        } catch (error) {
            console.error('Error while creating user', error)
            throw new InternalServerErrorException('General Error while creating student.')
        }
    }

    @HandleBsonErrors()
    async createSubscription(createSubscriptionDto: CreateSubscriptionDto, studentId: ObjectId): Promise<CreatedDto> {
        const student = await this.loadStudent(studentId)
        const created = await this.subscriptionsService.create(createSubscriptionDto, student._id)
        ;(student.subscriptions as ObjectId[]).push(new ObjectId(created.id))
        await student.save()

        return created
    }

    @HandleBsonErrors()
    async suspendSubscription(subscriptionId: string, studentId: ObjectId): Promise<void> {
        const subscriptionObjectId = new ObjectId(subscriptionId)
        const student = await this.loadStudent(studentId)
        const hasSubscription = (student.subscriptions as ObjectId[]).includes(subscriptionObjectId)
        if (!hasSubscription) {
            throw new NotFoundException('Student does not have subscription with the given id.')
        }
        await this.subscriptionsService.update(subscriptionId, { state: State.suspended })
    }

    async getSubscriptions(studentId: ObjectId, limit?: number, skip?: number): Promise<StudentSubscriptionDto[]> {
        const student = await this.loadStudent(studentId)
        return this.subscriptionsService.getManyForStudent(student.subscriptions as ObjectId[], limit, skip)
    }

    @HandleBsonErrors()
    async removeSubscription(subscriptionId: string, studentId: ObjectId): Promise<void> {
        const student = await this.loadStudent(studentId)
        const indexOfSubscription = student.subscriptions.findIndex(id => id._id.toString() === subscriptionId)
        if (indexOfSubscription === -1) {
            throw new NotFoundException('Student does not have subscription with the given id.')
        }
        ;(student.subscriptions as ObjectId[]).splice(indexOfSubscription, 1)
        await student.save()
        await this.subscriptionsService.update(subscriptionId, { state: State.deleted })
    }

    private async loadStudent(studentId: ObjectId): Promise<StudentDocument> {
        const student = await this.studentRepository.findById(studentId)
        if (!student) {
            throw new InternalServerErrorException('Student not found.')
        }
        return student
    }

    getOpenPrograms(limit?: number, skip?: number): Promise<StudentProgramDto[]> {
        return this.programsService.findAllForStudents(limit, skip)
    }
}
