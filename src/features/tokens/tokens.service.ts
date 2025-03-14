import { Injectable } from '@nestjs/common'
import { UserDocument } from '../users/schemas/user.schema'
import { RefreshTokenDocument } from './schemas/refresh-token.schema'
import { TokensRepository } from './tokens.repository'

@Injectable()
export class TokensService {
    constructor(private tokensRepository: TokensRepository) {}

    async create(refreshToken: string, user: UserDocument): Promise<void> {
        await this.tokensRepository.create({
            token: refreshToken,
            user,
        })
    }

    findOne(refreshToken: string): Promise<RefreshTokenDocument | undefined> {
        return this.tokensRepository.findOne({ token: refreshToken })
    }

    remove(refreshToken: string): Promise<boolean> {
        return this.tokensRepository.remove({ token: refreshToken })
    }
}
