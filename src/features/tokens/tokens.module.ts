import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema'
import { TokensRepository } from './tokens.repository'
import { TokensService } from './tokens.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }])],
    providers: [TokensService, TokensRepository],
    exports: [TokensService],
})
export class TokensModule {}
