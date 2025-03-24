import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { arePopulated } from '../../shared/helper/populated-type.helper'
import { ObjectId } from '../../shared/repository/types'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { ProgramDocument } from '../programs/schemas/program.schema'
import { SubjectDocument } from '../subjects/schemas/subject.schema'
import { SignUpManagerDto } from './dto/manager.dto'
import { ManagersRepository } from './managers.repository'

@Injectable()
export class ManagersService {
    constructor(
        private managersRepository: ManagersRepository,
        private authenticationService: AuthenticationService
    ) {}

    async create(manager: SignUpManagerDto): Promise<AuthenticationResponseDto> {
        const duplicate = await this.managersRepository.findOne({ email: manager.email })
        if (duplicate) {
            throw new ConflictException('A user with the same email already exists.')
        }
        try {
            manager.password = bcrypt.hashSync(manager.password, 10)
            const createdManager = await this.managersRepository.create(manager)
            return this.authenticationService.generateUserTokens(createdManager)
        } catch (error) {
            console.error('General Error while creating manager.', error)
            throw new InternalServerErrorException('General Error while creating manager.')
        }
    }

    async addProgram(id: ObjectId, program: ProgramDocument): Promise<void> {
        const creator = await this.managersRepository.findById(id)
        if (!creator) {
            throw new InternalServerErrorException(`Manager document not found.`)
        }
        if (arePopulated(creator.programs)) {
            throw new InternalServerErrorException(`Manager's program are unexpectedly populated.`)
        }
        creator.programs.push(program._id)
        await creator.save()
    }

    async addSubject(id: ObjectId, subject: SubjectDocument): Promise<void> {
        const creator = await this.managersRepository.findById(id)
        if (!creator) {
            throw new InternalServerErrorException(`Manager document not found.`)
        }
        if (arePopulated(creator.subjects)) {
            throw new InternalServerErrorException(`Manager's program are unexpectedly populated.`)
        }
        creator.subjects.push(subject._id)
        await creator.save()
    }
}
