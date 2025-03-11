import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { Student, StudentDocument } from './schemas/student.schema'

@Injectable()
export class StudentRepository extends RepositoryMongoBase<StudentDocument> {
    constructor(@InjectModel(Student.name) userModel: Model<StudentDocument>) {
        super(userModel)
    }
}
