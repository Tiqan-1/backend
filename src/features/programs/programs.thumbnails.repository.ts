import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RepositoryFileBase } from '../../shared/repository/repository-file-base'

@Injectable()
export class ProgramsThumbnailsRepository extends RepositoryFileBase {
    constructor(configService: ConfigService) {
        super('programs-thumbnails', configService)
    }
}
