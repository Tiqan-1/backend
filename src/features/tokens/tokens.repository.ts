import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RepositoryMongoBase } from '../../shared/repository/repository-mongo-base'
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema'

@Injectable()
export class TokensRepository extends RepositoryMongoBase<RefreshTokenDocument> {
    constructor(@InjectModel(RefreshToken.name) refreshTokenModel: Model<RefreshTokenDocument>) {
        super(refreshTokenModel)
    }
}
