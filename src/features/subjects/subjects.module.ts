import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthenticationModule } from '../authentication/authentication.module'
import { Subject, SubjectSchema } from './schemas/subject.schema'
import { SubjectsController } from './subjects.controller'
import { SubjectsRepository } from './subjects.repository'
import { SubjectsService } from './subjects.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }]), AuthenticationModule],
    controllers: [SubjectsController],
    providers: [SubjectsService, SubjectsRepository],
})
export class SubjectsModule {}
