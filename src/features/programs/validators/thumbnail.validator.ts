import { MultipartFile } from '@fastify/multipart'
import { BadRequestException } from '@nestjs/common'
import path from 'path'

const allowedFormats = ['.jpg', '.png', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export class ThumbnailValidator {
    static validate(file: MultipartFile | undefined): file is MultipartFile {
        if (!file) {
            throw new BadRequestException('Thumbnail is required.')
        }
        if (file.fields && 'size' in file.fields && typeof file.fields.size === 'number' && file.fields.size > 5 * 1024 * 1024) {
            throw new BadRequestException('File size is too large.')
        }
        if (!allowedFormats.includes(path.extname(file.filename).toLowerCase())) {
            throw new BadRequestException('Only image formats allowed.')
        }
        return true
    }
}
