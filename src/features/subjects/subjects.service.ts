import { Injectable } from '@nestjs/common'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(private readonly repository: SubjectsRepository) {}

    create(subject: CreateSubjectDto): Promise<SubjectDto> {
        return this.repository.create(subject)
    }
}
