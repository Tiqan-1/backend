import { Injectable } from '@nestjs/common'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(private readonly repository: SubjectsRepository) {}

    async create(subject: CreateSubjectDto): Promise<SubjectDto> {
        const result = await this.repository.create(subject)
        return new SubjectDto(result)
    }

    async findAllForUser(user): Promise<SubjectDto[]> {
        this.repository.findAll()
    }
}
