import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthenticationModule } from '../authentication/authentication.module'
import { User, UserSchema } from '../users/schemas/user.schema'
import { Student, StudentSchema } from './schemas/student.schema'
import { StudentsController } from './students.controller'
import { StudentRepository } from './students.repository'
import { StudentsService } from './students.service'

@Module({
    imports: [
        AuthenticationModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema, discriminators: [{ name: Student.name, schema: StudentSchema }] },
        ]),
    ],
    providers: [StudentsService, StudentRepository],
    controllers: [StudentsController],
})
export class StudentsModule {}
