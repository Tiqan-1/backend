import { Module } from '@nestjs/common'
import { SharedDocumentsModule } from '../../shared/documents-validator/shared-documents.module'
import { AuthenticationModule } from '../authentication/authentication.module'
import { LessonsController } from './lessons.controller'
import { LessonsRepository } from './lessons.repository'
import { LessonsService } from './lessons.service'

@Module({
    imports: [SharedDocumentsModule, AuthenticationModule],
    controllers: [LessonsController],
    providers: [LessonsService, LessonsRepository],
    exports: [LessonsService],
})
export class LessonsModule {}
