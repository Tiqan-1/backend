import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MIGRATION_SCRIPTS_MAP } from './migration-scripts/migration-scripts.map'
import { MigrationService } from './migration.service'
import { SharedDocumentsService } from './shared-documents.service'

describe('MigrationService', () => {
    let service: MigrationService
    let documentsService: SharedDocumentsService

    const mockDbVersion = {
        version: 1,
        save: vi.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MigrationService,
                {
                    provide: SharedDocumentsService,
                    useValue: {
                        getDbVersion: vi.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<MigrationService>(MigrationService)
        documentsService = module.get<SharedDocumentsService>(SharedDocumentsService)
        vi.spyOn(MIGRATION_SCRIPTS_MAP, 'size', 'get').mockReturnValue(2)
    })

    it('should skip migration when version is up to date', async () => {
        vi.spyOn(documentsService, 'getDbVersion').mockResolvedValue({ version: 2, save: vi.fn() } as any)
        await service.migrate()
        expect(documentsService.getDbVersion).toHaveBeenCalled()
    })

    it('should execute migration successfully', async () => {
        const migrationScript = {
            up: vi.fn(),
        }
        vi.spyOn(MIGRATION_SCRIPTS_MAP, 'get').mockReturnValue(migrationScript)
        vi.spyOn(documentsService, 'getDbVersion').mockResolvedValue(mockDbVersion as any)

        await service.migrate()

        expect(documentsService.getDbVersion).toHaveBeenCalled()
        expect(migrationScript.up).toHaveBeenCalledWith(documentsService)
        expect(mockDbVersion.save).toHaveBeenCalled()
    })

    it('should handle missing migration script', async () => {
        vi.spyOn(MIGRATION_SCRIPTS_MAP, 'get').mockReturnValue(undefined)
        vi.spyOn(documentsService, 'getDbVersion').mockResolvedValue(mockDbVersion as any)

        await service.migrate()

        expect(documentsService.getDbVersion).toHaveBeenCalled()
        expect(mockDbVersion.save).not.toHaveBeenCalled()
    })
})
