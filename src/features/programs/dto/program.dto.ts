import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { areNotPopulated, arePopulated } from '../../../shared/helper/populated-type.helper'
import { ObjectId, Populated } from '../../../shared/repository/types'
import { LevelDto } from '../../levels/dto/level.dto'
import { LevelDocument } from '../../levels/schemas/level.schema'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { ProgramState } from '../enums/program-state.enum'
import { ProgramDocument } from '../schemas/program.schema'

const now = normalizeDate(new Date())

export class ProgramDto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'مبادرة التأسيس' })
    @IsString()
    name: string

    @ApiProperty({ type: String, required: true, example: 'برنامج تفاعلي يهدف إلى تأسيس الطالب في العلوم الشرعية' })
    @IsString()
    description: string

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, enum: ProgramState, required: true })
    @IsEnum(ProgramState)
    state: ProgramState

    @ApiProperty({ type: Date, required: true, example: now })
    @IsDateString()
    start: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @IsDateString()
    end: Date

    @ApiProperty({ type: Date, required: false, example: now })
    @IsOptional()
    @IsDateString()
    registrationStart?: Date

    @ApiProperty({ type: Date, required: false, example: now })
    @IsOptional()
    @IsDateString()
    registrationEnd?: Date

    @ApiProperty({ type: LevelDto, required: true, isArray: true })
    @ValidateNested({ each: true })
    levels: LevelDto[]

    static fromDocuments(foundPrograms: ProgramDocument[] = []): ProgramDto[] {
        return foundPrograms.map(document => this.fromDocument(document))
    }

    static fromDocument(document: ProgramDocument): ProgramDto {
        return {
            id: document._id.toString(),
            name: document.name,
            state: document.state,
            description: document.description,
            start: document.start,
            end: document.end,
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            registrationStart: document.registrationStart,
            registrationEnd: document.registrationEnd,
            levels: arePopulated(document.levels) ? LevelDto.fromDocuments(document.levels) : [],
        }
    }
}

export class StudentProgramDto extends OmitType(ProgramDto, ['state']) {
    static fromDocuments(foundPrograms: ProgramDocument[] = []): StudentProgramDto[] {
        return foundPrograms.map(foundProgram => this.fromDocument(foundProgram))
    }

    static fromDocument(document: ProgramDocument): StudentProgramDto {
        return {
            id: document._id.toString(),
            name: document.name,
            description: document.description,
            start: document.start,
            end: document.end,
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            registrationStart: document.start,
            registrationEnd: document.end,
            levels: LevelDto.fromDocuments(document.levels as Populated<LevelDocument[]>),
        }
    }
}

export class StudentProgramUnpopulatedDto extends OmitType(StudentProgramDto, ['levels']) {
    @ApiProperty({ type: String, required: false, isArray: true })
    @IsOptional()
    @ValidateNested({ each: true })
    levelIds?: string[]

    static fromDocument(document: ProgramDocument): StudentProgramUnpopulatedDto {
        return {
            id: document._id.toString(),
            name: document.name,
            description: document.description,
            start: document.start,
            end: document.end,
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            registrationStart: document.start,
            registrationEnd: document.end,
            levelIds: areNotPopulated(document.levels) ? document.levels.map(id => id.toString()) : [],
        }
    }
}

export class CreateProgramDto extends OmitType(ProgramDto, ['id', 'state', 'levels', 'createdBy']) {
    @ApiProperty({ type: String, required: false, isArray: true })
    @IsOptional()
    @ValidateNested({ each: true })
    levelIds?: string[]

    static toDocument(dto: CreateProgramDto, createdBy: ObjectId): object {
        return {
            name: dto.name,
            description: dto.description,
            start: dto.start,
            end: dto.end,
            registrationStart: dto.registrationStart,
            registrationEnd: dto.registrationEnd,
            createdBy,
        }
    }
}

export class UpdateProgramDto extends PartialType(CreateProgramDto) {
    @ApiProperty({ type: String, enum: ProgramState, required: false })
    @IsOptional()
    @IsEnum(ProgramState)
    state: ProgramState

    static toDocument(dto: UpdateProgramDto): object {
        return {
            name: dto.name,
            description: dto.description,
            state: dto.state,
            start: dto.start,
            end: dto.end,
            registrationStart: dto.registrationStart,
            registrationEnd: dto.registrationEnd,
        }
    }
}
