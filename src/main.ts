import multipart from '@fastify/multipart'
import { ConsoleLogger, ValidationPipe } from '@nestjs/common'
import { LogLevel } from '@nestjs/common/services/logger.service'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import * as process from 'node:process'
import { AppModule } from './app.module'
import { MigrationService } from './shared/database-services/migration.service'
import { MongoDbExceptionFilter } from './shared/exceptions/mongo-db-exception.filter'
import { SecurityExceptionFilter } from './shared/exceptions/security-exception.filter'

async function bootstrap(): Promise<void> {
    const logLevels: LogLevel[] =
        process.env.NODE_ENV === 'production' ? ['log', 'error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose']
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        logger: new ConsoleLogger({ logLevels, json: true, colors: process.env.NODE_ENV === 'development' }),
    })

    const migrationService = app.get(MigrationService)
    await migrationService.migrate()

    await app.register(multipart)
    app.enableCors({
        origin: 'https://mubadarat.yaseen.dev',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        })
    )
    app.useGlobalFilters(new MongoDbExceptionFilter(), new SecurityExceptionFilter())

    const config = new DocumentBuilder()
        .setTitle('Mubadarat')
        .setDescription('The Mubadarat API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build()

    const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, documentFactory)

    app.enableShutdownHooks()

    await app.listen(process.env.PORT ?? 3000)
}
bootstrap().catch(err => console.log(err))
