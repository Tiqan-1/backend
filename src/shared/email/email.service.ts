import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as handlebars from 'handlebars'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter
    private verificationCodeTemplate: HandlebarsTemplateDelegate
    private resetPasswordTemplate: HandlebarsTemplateDelegate

    constructor(private configService: ConfigService) {}

    onModuleInit(): void {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('EMAIL_HOST'),
            port: this.configService.get('EMAIL_PORT'),
            secure: this.configService.get('EMAIL_SECURE') === true,
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASSWORD'),
            },
        })
        const verificationCodeFile = fs.readFileSync(path.join(__dirname, 'templates', 'verification-code.template.hbs'), 'utf-8')
        const resetPasswordFile = fs.readFileSync(path.join(__dirname, 'templates', 'reset-password.template.hbs'), 'utf-8')
        this.verificationCodeTemplate = handlebars.compile(verificationCodeFile)
        this.resetPasswordTemplate = handlebars.compile(resetPasswordFile)
    }

    async sendVerificationEmail(email: string, userId: string): Promise<void> {
        const verificationUrl = `${this.configService.get('HOST')}/authentication/verify/${userId}`
        const html = this.verificationCodeTemplate({ verificationUrl })
        await this.transporter.sendMail({
            from: this.configService.get('EMAIL_USER'),
            to: email,
            subject: 'Account verification',
            html,
        })
    }

    async sendResetPasswordEmail(email: string, code: string): Promise<void> {
        const html = this.resetPasswordTemplate({ code })
        await this.transporter.sendMail({
            from: this.configService.get('EMAIL_USER'),
            to: email,
            subject: 'Reset password',
            html,
        })
    }
}
