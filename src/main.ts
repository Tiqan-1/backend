import { ConsoleLogger } from '@nestjs/common'
import { LogLevel } from '@nestjs/common/services/logger.service'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import 'multer'
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n'
import * as process from 'node:process'
import { AppModule } from './app.module'
import { MigrationService } from './shared/database-services/migration.service'
import { SecurityErrorFilter } from './shared/errors/security-error.filter'

async function bootstrap(): Promise<void> {
    const logLevels: LogLevel[] =
        process.env.NODE_ENV === 'production' ? ['log', 'error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose']
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger({ logLevels, json: true, colors: process.env.NODE_ENV === 'development' }),
    })

    const migrationService = app.get(MigrationService)
    await migrationService.migrate()

    //await app.register(multipart)
    app.enableCors({
        origin: ['https://mubadarat.yaseen.dev', 'https://student.yaseen.dev'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
    app.useGlobalPipes(new I18nValidationPipe())
    app.useGlobalFilters(new SecurityErrorFilter(), new I18nValidationExceptionFilter({ detailedErrors: false }))

    const config = new DocumentBuilder()
        .setTitle('Mubadarat')
        .setDescription('The Mubadarat API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build()

    const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, documentFactory)

    app.enableShutdownHooks()

    await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}
bootstrap().catch(err => console.log(err))
