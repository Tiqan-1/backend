import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { ProgramsModule } from '../programs/programs.module'
import { LevelsController } from './levels.controller'
import { LevelsRepository } from './levels.repository'
import { LevelsService } from './levels.service'

@Module({
    imports: [ProgramsModule, SharedDocumentsModule],
    controllers: [LevelsController],
    providers: [LevelsService, LevelsRepository],
})
export class LevelsModule {}
