import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthenticationService } from '../authentication/authentication.service'
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto'
import { Role } from '../authentication/enums/role.enum'
import { SignUpStudentDto } from './dto/student.dto'
import { StudentRepository } from './students.repository'

@Injectable()
export class StudentsService {
    constructor(
        private readonly studentRepository: StudentRepository,
        private readonly authenticationService: AuthenticationService
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
}
