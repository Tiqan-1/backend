import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBase64, IsBooleanString, IsDate, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { i18nValidationMessage } from 'nestjs-i18n'
import { SearchQueryDto } from '../../../shared/dto/search.query.dto'
import { normalizeDate } from '../../../shared/helper/date.helper'
import { arePopulated } from '../../../shared/helper/populated-type.helper'
import { ObjectId } from '../../../shared/repository/types'
import { LevelDto } from '../../levels/dto/level.dto'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { ProgramState } from '../enums/program-state.enum'
import { ProgramSubscriptionType } from '../enums/program-subscription-type.enum'
import { ProgramDocument } from '../schemas/program.schema'
import { ProgramWithSubscription } from '../types'

const now = normalizeDate(new Date())

export class ProgramDto {
    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsMongoId({ message: i18nValidationMessage('validation.mongoId') })
    id: string

    @ApiProperty({ type: String, required: true, example: 'مبادرة التأسيس' })
    @IsString({ message: i18nValidationMessage('validation.string') })
    name: string

    @ApiProperty({ type: String, required: true, example: 'برنامج تفاعلي يهدف إلى تأسيس الطالب في العلوم الشرعية' })
    @IsString({ message: i18nValidationMessage('validation.string') })
    description: string

    @ApiProperty({ type: String, required: false, description: 'صورة للبرنامج بصيغة base64' })
    @IsOptional()
    @IsBase64()
    thumbnail?: string

    @ApiProperty({ type: () => SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, enum: ProgramState, required: true })
    @IsEnum(ProgramState, { message: i18nValidationMessage('validation.enum', { values: Object.values(ProgramState) }) })
    state: ProgramState

    @ApiProperty({ type: String, enum: ProgramSubscriptionType, required: false, default: ProgramSubscriptionType.public })
    @IsEnum(ProgramSubscriptionType, {
        message: i18nValidationMessage('validation.enum', { values: Object.values(ProgramSubscriptionType) }),
    })
    programSubscriptionType: ProgramSubscriptionType // = ProgramSubscriptionType.public

    @ApiProperty({ type: String, required: false, example: 'https://www.forms.google.com/test' })
    @IsOptional()
    @IsString({ message: i18nValidationMessage('validation.string') })
    subscriptionFormUrl?: string

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date') })
    start: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date') })
    end: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date') })
    registrationStart: Date

    @ApiProperty({ type: Date, required: true, example: now })
    @Type(() => Date)
    @IsDate({ message: i18nValidationMessage('validation.date') })
    registrationEnd: Date

    @ApiProperty({ type: LevelDto, required: true, isArray: true })
    @ValidateNested({ each: true })
    levels: LevelDto[]

    static fromDocuments(foundPrograms: ProgramDocument[] = []): ProgramDto[] {
        return foundPrograms.map(document => this.fromDocument(document)).sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    static fromDocument(document: ProgramDocument): ProgramDto {
        return {
            id: document._id.toString(),
            name: document.name,
            state: document.state,
            programSubscriptionType: document.subscriptionType,
            subscriptionFormUrl: document.subscriptionFormUrl,
            thumbnail: document.thumbnail,
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

export class ProgramWithSubscriptionDto extends ProgramDto {
    @ApiProperty({ type: String, required: false })
    @IsOptional()
    subscriptionId?: string

    static fromDocuments(foundPrograms: ProgramWithSubscription[] = []): ProgramDto[] {
        return foundPrograms.map(document => this.fromDocument(document)).sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    static fromDocument(document: ProgramWithSubscription): ProgramWithSubscriptionDto {
        return {
            id: document._id.toString(),
            name: document.name,
            state: document.state,
            programSubscriptionType: document.subscriptionType,
            subscriptionFormUrl: document.subscriptionFormUrl,
            thumbnail: document.thumbnail,
            description: document.description,
            start: document.start,
            end: document.end,
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            registrationStart: document.registrationStart,
            registrationEnd: document.registrationEnd,
            levels: arePopulated(document.levels) ? LevelDto.fromDocuments(document.levels) : [],
            subscriptionId: document.subscriptionId,
        }
    }
}

export class CreateProgramDto extends OmitType(ProgramDto, ['id', 'state', 'levels', 'createdBy', 'thumbnail'] as const) {
    @ApiProperty({ type: String, required: false, isArray: true })
    @IsOptional()
    @ValidateNested({ each: true })
    @IsMongoId({ each: true })
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
    state?: ProgramState

    static toDocument(dto: UpdateProgramDto): object {
        return {
            name: dto.name,
            description: dto.description,
            state: dto.state,
            start: dto.start,
            end: dto.end,
            registrationStart: dto.registrationStart,
            registrationEnd: dto.registrationEnd,
            levelIds: dto.levelIds,
        }
    }
}

export class SearchProgramQueryDto extends IntersectionType(
    PartialType(OmitType(ProgramDto, ['thumbnail', 'levels', 'createdBy'] as const)),
    SearchQueryDto
) {}

enum SearchProgramState {
    published = 'published',
    suspended = 'suspended',
    cancelled = 'cancelled',
}

export class SearchStudentProgramQueryDto extends OmitType(SearchProgramQueryDto, ['state'] as const) {
    @ApiProperty({ type: String, required: false, enum: SearchProgramState })
    @IsOptional()
    @IsEnum(SearchProgramState, {
        message: i18nValidationMessage('validation.enum', { values: Object.values(SearchProgramState) }),
    })
    state: SearchProgramState

    @ApiProperty({ type: Boolean, required: false })
    @IsOptional()
    @IsBooleanString()
    openForRegistration?: 'true' | 'false' = 'false'
}
