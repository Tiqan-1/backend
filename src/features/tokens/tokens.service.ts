import { Injectable } from '@nestjs/common'
import { RefreshTokenDocument } from './schemas/refresh-token.schema'
import { TokensRepository } from './tokens.repository'

@Injectable()
export class TokensService {
    constructor(private tokensRepository: TokensRepository) {}

    async create(refreshToken: string, userId: string): Promise<void> {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 10)

        await this.tokensRepository.create({
            token: refreshToken,
            userId: userId,
            expiryDate,
            lastUsedAt: new Date(),
        })
    }

    findOne(refreshToken: string): Promise<RefreshTokenDocument | undefined> {
        return this.tokensRepository.findOne({ token: refreshToken, expiryDate: { $gte: new Date() } })
    }

    async remove(refreshToken: string): Promise<void> {
        try {
            await this.tokensRepository.remove({ token: refreshToken })
        } catch (error) {
            console.error('error while removing token', error)
        }
    }
}
