import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { WirdTaskDocument } from '../schemas/wird-task.schema'
import { TaskDto } from './task.dto'

export class WirdTaskDto extends TaskDto {
    @ApiProperty({
        type: String,
        required: false,
        description: 'The wird title for the task (required for Wird tasks)',
        example: 'سورة آل عمران (1)',
    })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'wirdTitle' }) })
    @IsOptional()
    wirdTitle?: string

    @ApiProperty({
        type: String,
        required: false,
        description: 'The wird details for the task (required for Wird tasks)',
        example: 'صفحة 1',
    })
    @IsString({ message: i18nValidationMessage('validation.string', { property: 'wirdDetails' }) })
    @IsOptional()
    wirdDetails?: string

    constructor(document: WirdTaskDocument) {
        super(document)
        this.wirdTitle = document.wirdTitle
        this.wirdDetails = document.wirdDetails
    }

    static fromDocument(document: WirdTaskDocument): WirdTaskDto {
        return new WirdTaskDto(document)
    }

    static fromDocuments(documents: WirdTaskDocument[]): WirdTaskDto[] {
        return documents.map(document => WirdTaskDto.fromDocument(document))
    }
}
