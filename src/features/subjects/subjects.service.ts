import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'
import { TokenUser } from '../authentication/types/token-user'
import { CreateSubjectDto, SubjectDto } from './dto/subject.dto'
import { SubjectsRepository } from './subjects.repository'

@Injectable()
export class SubjectsService {
    constructor(private readonly repository: SubjectsRepository) {}

    async create(subject: CreateSubjectDto, manager: TokenUser): Promise<SubjectDto> {
        const result = await this.repository.create({
            ...subject,
            createdBy: manager.id,
            lessons: subject.lessonIds?.map(lessonId => new Types.ObjectId(lessonId)),
        })
        return new SubjectDto(result)
    }

    async findAllByManagerId(manager: TokenUser): Promise<SubjectDto[]> {
        const result = await this.repository.findAllByManagerId(new Types.ObjectId(manager.id))
        return result.map(subject => new SubjectDto(subject))
    }

    async findAll() {
        const result = await this.repository.findAll()
        return result.map(subject => new SubjectDto(subject))
    }
}
