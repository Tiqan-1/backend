import multipart from '@fastify/multipart'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { MongoDbExceptionFilter } from './shared/errors/mongo-db-exception.filter'

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }))

    await app.register(multipart)
    app.enableCors({
        origin: 'https://mubadarat.yaseen.dev',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
    app.useGlobalPipes(new ValidationPipe())
    app.useGlobalFilters(new MongoDbExceptionFilter())

    const config = new DocumentBuilder()
        .setTitle('Mubadarat')
        .setDescription('The Mubadarat API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build()

    const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, documentFactory)

    await app.listen(process.env.PORT ?? 3000)
}
bootstrap().catch(err => console.log(err))
