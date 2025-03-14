import { ApiProperty, OmitType } from '@nestjs/swagger'
import { IsOptional, IsString, ValidateNested } from 'class-validator'
import { LessonDto } from '../../lessons/dto/lesson.dto'

export class SubjectDto {
    @ApiProperty({ type: String, required: true, example: 'subjectId' })
    @IsString()
    id: string

    @ApiProperty({ type: String, required: true, example: 'الفقه' })
    @IsString()
    name: string

    @ApiProperty({ type: String, required: false, example: 'الفقه على المذهب الشافعي' })
    @IsString()
    @IsOptional()
    description?: string

    @ApiProperty({ type: LessonDto, isArray: true, required: true })
    @ValidateNested({ each: true })
    lessons: LessonDto[]
}

export class CreateSubjectDto extends OmitType(SubjectDto, ['id', 'lessons']) {
    @ApiProperty({ type: String, isArray: true, required: true })
    @IsString({ each: true })
    @IsOptional()
    lessonIds?: string[]
}
