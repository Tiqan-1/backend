import { Injectable } from '@nestjs/common'
import { TokenUser } from '../../shared/types/token-user'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(private readonly repository: SubjectsRepository) {}

    async create(subject: CreateSubjectDto, manager: TokenUser): Promise<SubjectDto> {
        const result = await this.repository.create({ ...subject, createdBy: manager.id })
        return new SubjectDto(result)
    }

    async findAllByManagerId(manager: TokenUser): Promise<SubjectDto[]> {
        const result = await this.repository.findAllByManagerId(manager.id)
        return result.map(subject => new SubjectDto(subject))
    }

    async findAll() {
        const result = await this.repository.findAll()
        return result.map(subject => new SubjectDto(subject))
    }
}
