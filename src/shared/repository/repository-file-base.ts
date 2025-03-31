import { ConfigService } from '@nestjs/config'
import * as fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { RepositoryBase } from './repository-base'

const pump = promisify(pipeline)

export abstract class RepositoryFileBase extends RepositoryBase<File> {
    private readonly uploadDir: string
    constructor(
        private readonly folderName: string,
        private readonly configService: ConfigService
    ) {
        super()
        this.uploadDir = path.join(this.configService.get('UPLOAD_FOLDER') as string, this.folderName)
    }

    async create(file: File): Promise<string> {
        // Save the uploaded file to the server's file system
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true })
        }

        const uniqueFilename = `${uuidv4()}-${file.name}`
        const filePath = path.join(this.uploadDir, uniqueFilename)
        try {
            await pump(file.stream(), fs.createWriteStream(filePath))
        } catch (error) {
            throw new Error(`Failed to save file`, error as Error)
        }

        return uniqueFilename
    }

    /** not used */
    findAll(): Promise<File[]> {
        return Promise.resolve([])
    }

    async findOne(fileName: string): Promise<File | undefined> {
        if (!fs.existsSync(this.uploadDir)) {
            return undefined
        }
        const filePath = path.join(this.uploadDir, fileName)
        return await fs.readFile(filePath, 'utf-8')
    }
}
