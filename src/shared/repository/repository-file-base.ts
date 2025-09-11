import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'node:fs'
import path from 'path'

export abstract class RepositoryFileBase {
    private readonly logger: Logger = new Logger(RepositoryFileBase.name)
    private readonly uploadDir: string

    protected constructor(
        private readonly folderName: string,
        private readonly configService: ConfigService
    ) {
        this.uploadDir = path.join(this.configService.get('UPLOAD_FOLDER') as string, this.folderName)
    }

    async findOne(fileName: string): Promise<string | undefined> {
        if (!fs.existsSync(this.uploadDir)) {
            return undefined
        }
        const filePath = path.join(this.uploadDir, fileName)
        return fs.promises.readFile(filePath, 'base64')
    }

    async remove(fileName: string): Promise<void> {
        if (!fs.existsSync(this.uploadDir)) {
            return undefined
        }
        const filePath = path.join(this.uploadDir, fileName)
        try {
            await fs.promises.rm(filePath)
            this.logger.log(`File ${filePath} removed.`)
        } catch (error) {
            this.logger.warn(`Failed to remove file ${filePath}`, error as Error)
        }
    }
}
