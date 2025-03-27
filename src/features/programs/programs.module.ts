import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { LevelsModule } from '../levels/levels.module'
import { ProgramsController } from './programs.controller'
import { ProgramsRepository } from './programs.repository'
import { ProgramsService } from './programs.service'

@Module({
    imports: [SharedDocumentsModule, LevelsModule],
    controllers: [ProgramsController],
    providers: [ProgramsService, ProgramsRepository],
    exports: [ProgramsService],
})
export class ProgramsModule {}
