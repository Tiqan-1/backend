import { ConfigService } from '@nestjs/config'
import { RepositoryFileBase } from '../../shared/repository/repository-file-base'

export class ProgramsThumbnailsRepository extends RepositoryFileBase {
    constructor(configService: ConfigService) {
        super('programs-thumbnails', configService)
    }
}
