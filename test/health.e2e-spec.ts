import { HttpStatus, INestApplication } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { HealthController } from '../src/features/health/health.controller'

describe('HealthController (e2e)', () => {
    let app: INestApplication<App>
    let readyState = 1

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: getConnectionToken(),
                    useValue: {
                        get readyState(): number {
                            return readyState
                        },
                    },
                },
            ],
        }).compile()

        app = module.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    it('returns 200 with status ok when MongoDB is connected', async () => {
        readyState = 1
        const res = await request(app.getHttpServer()).get('/api/health').expect(HttpStatus.OK)
        expect(res.body.status).toBe('ok')
        expect(res.body.db).toBe('up')
    })

    it('returns 503 when MongoDB is not connected', async () => {
        readyState = 0
        const res = await request(app.getHttpServer()).get('/api/health').expect(HttpStatus.SERVICE_UNAVAILABLE)
        expect(res.body.db).toBe('down')
    })
})
