import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { ObjectId } from '../../../shared/repository/types'
import { LevelDto } from '../../levels/dto/level.dto'
import { simpleManagerDto } from '../../managers/dto/manager.dto'
import { ProgramDocument } from '../schemas/program.schema'

const now = normalizeDate(new Date())

export class ProgramDto {
    constructor(document: ProgramDocument) {
        this.id = document._id.toString()
        this.name = document.name
        this.createdBy = document.createdBy
        this.description = document.description
        this.start = document.start
        this.end = document.end
        this.registrationStart = document.registrationStart
        this.registrationEnd = document.registrationEnd
        this.levels = LevelDto.fromDocuments(document.levels)
    }

    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'مبادرة التأسيس' })
    @IsString()
    name: string

    @ApiProperty({ type: () => simpleManagerDto, required: true })
    @ValidateNested()
    createdBy: simpleManagerDto

    @ApiProperty({ type: String, required: false, example: 'برنامج تفاعلي يهدف إلى تأسيس الطالب في العلوم الشرعية' })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ type: Boolean, required: true })
    @IsBoolean()
    active: boolean

    @ApiProperty({ type: Date, required: true, example: now })
    @IsDateString()
    start: Date

    @ApiProperty({ type: Date, required: true, example: new Date(now.setFullYear(now.getFullYear() + 1)) })
    @IsDateString()
    end: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @IsOptional()
    @IsDateString()
    registrationStart?: Date

    @ApiProperty({ type: Date, required: true, example: new Date(now.setHours(now.getHours() + 6)) })
    @IsOptional()
    @IsDateString()
    registrationEnd?: Date

    @ApiProperty({ type: LevelDto, required: true })
    @ValidateNested({ each: true })
    levels: LevelDto[]

    static fromDocuments(foundPrograms: ProgramDocument[]): ProgramDto[] {
        return foundPrograms.map(document => this.fromDocument(document))
    }

    static fromDocument(document: ProgramDocument): ProgramDto {
        return new ProgramDto(document)
    }
}

export class CreateProgramDto extends OmitType(ProgramDto, ['id', 'createdBy', 'levels']) {
    @ApiProperty({ type: String, required: true })
    @IsNotEmpty()
    @ValidateNested({ each: true })
    levelIds: string[]

    static toDocument(dto: CreateProgramDto, creatorId: ObjectId): object {
        return {
            name: dto.name,
            description: dto.description,
            start: dto.start,
            end: dto.end,
            registrationStart: dto.registrationStart,
            registrationEnd: dto.registrationEnd,
            levels: dto.levelIds.map(levelId => new ObjectId(levelId)),
            createdBy: creatorId,
        }
    }
}

export class UpdateProgramDto extends PartialType(CreateProgramDto) {
    static toDocument(dto: UpdateProgramDto): object {
        return {
            name: dto.name,
            description: dto.description,
            start: dto.start,
            end: dto.end,
            registrationStart: dto.registrationStart,
            registrationEnd: dto.registrationEnd,
            levels: dto.levelIds?.map(levelId => new ObjectId(levelId)),
        }
    }
}
