import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TestingModule } from '@nestjs/testing'
import { vi } from 'vitest'
import { JwtStrategy } from '../../../features/authentication/strategies/jwt.strategy'
import { TokenUser } from '../../../features/authentication/types/token-user'
import { ObjectId } from '../../repository/types'

export const JwtMockModule = JwtModule.register({
    secret: 'secret',
    signOptions: { expiresIn: '1d' },
})

const configService = { get: vi.fn().mockImplementation(key => (key === 'UPLOAD_FOLDER' ? 'upload-test' : `secret`)) }
export const ConfigServiceProvider = { provide: ConfigService, useValue: configService }

// workaround to correctly provide ObjectId to prevent mismatches between in memory and normal mongodb
export function mockJwtStrategyValidation(module: TestingModule): void {
    module.get(JwtStrategy).validate = vi
        .fn()
        .mockImplementation((payload: TokenUser) => ({ role: payload.role, id: new ObjectId(payload.id) }))
}
