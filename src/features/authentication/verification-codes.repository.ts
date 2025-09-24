import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { VerificationCode, VerificationCodeDocument } from './schema/verification-code.schema'

@Injectable()
export class VerificationCodesRepository extends RepositoryMongoBase<VerificationCodeDocument> {
    constructor(@InjectModel(VerificationCode.name) model: Model<VerificationCodeDocument>) {
        super(model)
    }
}
