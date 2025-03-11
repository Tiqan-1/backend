import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { Role } from '../../shared/enums/role.enum'
import { SignUpStudentDto, StudentDto } from './dto/student.dto'
import { StudentRepository } from './students.repository'

@Injectable()
export class StudentsService {
    constructor(private readonly studentRepository: StudentRepository) {}

    async create(student: SignUpStudentDto): Promise<StudentDto> {
        try {
            student.password = bcrypt.hashSync(student.password, 10)
            const createdStudent = await this.studentRepository.create({ ...student, role: Role.Student })
            return new StudentDto(createdStudent)
        } catch (error) {
            console.error('error while creating user', error)
            throw new InternalServerErrorException()
        }
    }
}
