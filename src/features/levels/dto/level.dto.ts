import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsMongoId, IsString, ValidateNested } from 'class-validator'
import { SearchQueryDto } from 'src/shared/dto/search.query.dto'
import { Populated } from '../../../shared/repository/types'
import { SimpleManagerDto } from '../../managers/dto/manager.dto'
import { ManagerDocument } from '../../managers/schemas/manager.schema'
import { TaskDto } from '../../tasks/dto/task.dto'
import { TaskDocument } from '../../tasks/schemas/task.schema'
import { LevelDocument } from '../schemas/level.schema'

export class LevelDto {
    @ApiProperty({ type: String, required: true, example: 'levelId' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true, example: 'programId' })
    @IsMongoId()
    programId: string

    @ApiProperty({ type: SimpleManagerDto, required: true })
    @ValidateNested()
    createdBy: SimpleManagerDto

    @ApiProperty({ type: String, required: true, example: 'المستوى الأول' })
    @IsString()
    name: string

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @Type(() => Date)
    @IsDate()
    start: Date

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @Type(() => Date)
    @IsDate()
    end: Date

    @ApiProperty({ type: TaskDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    tasks: TaskDto[]

    static fromDocuments(levels: LevelDocument[] = []): LevelDto[] {
        return levels.map(level => this.fromDocument(level)).sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    static fromDocument(document: LevelDocument): LevelDto {
        return {
            id: document._id.toString(),
            name: document.name,
            start: document.start,
            end: document.end,
            programId: document.programId.toString(),
            createdBy: SimpleManagerDto.fromDocument(document.createdBy as ManagerDocument),
            tasks: TaskDto.fromDocuments(document.tasks as Populated<TaskDocument[]>),
        }
    }
}

export class CreateLevelDto extends OmitType(LevelDto, ['id', 'tasks', 'createdBy'] as const) {}

export class UpdateLevelDto extends PartialType(OmitType(CreateLevelDto, ['programId'] as const)) {}

export class SearchLevelsQueryDto extends IntersectionType(
    PartialType(OmitType(LevelDto, ['tasks', 'createdBy'] as const)),
    SearchQueryDto
) {}
