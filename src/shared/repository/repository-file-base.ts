import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const pump = promisify(pipeline)

export abstract class RepositoryFileBase {
    private readonly logger: Logger = new Logger(RepositoryFileBase.name)
    private readonly uploadDir: string

    protected constructor(
        private readonly folderName: string,
        private readonly configService: ConfigService
    ) {
        this.uploadDir = path.join(this.configService.get('UPLOAD_FOLDER') as string, this.folderName)
    }

    async create(multipartFile: Express.Multer.File): Promise<string> {
        // Save the uploaded file to the server's file system
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true })
        }

        const uniqueFilename = `${uuidv4()}-${multipartFile.filename}`
        const filePath = path.join(this.uploadDir, uniqueFilename)
        try {
            await pump(multipartFile.stream, fs.createWriteStream(filePath))
            this.logger.log(`File ${filePath} created.`)
        } catch (error) {
            throw new Error(`Failed to save file`, error as Error)
        }

        return uniqueFilename
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
        await fs.promises.rm(filePath)
        this.logger.log(`File ${filePath} removed.`)
    }
}
