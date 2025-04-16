import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsDateString, IsMongoId, IsString, ValidateNested } from 'class-validator'
import { Populated } from '../../../shared/repository/types'
import { TaskDto } from '../../tasks/dto/task.dto'
import { TaskDocument } from '../../tasks/schemas/task.schema'
import { LevelDocument } from '../schemas/level.schema'

export class LevelDto {
    @ApiProperty({ type: String, required: true, example: 'levelId' })
    @IsMongoId()
    id: string

    @ApiProperty({ type: String, required: true, example: 'المستوى الأول' })
    @IsString()
    name: string

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
    start: Date

    @ApiProperty({ type: Date, required: true, example: new Date() })
    @IsDateString()
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
            tasks: TaskDto.fromDocuments(document.tasks as Populated<TaskDocument[]>),
        }
    }
}

export class CreateLevelDto extends OmitType(LevelDto, ['id', 'tasks']) {}

export class UpdateLevelDto extends PartialType(CreateLevelDto) {}
