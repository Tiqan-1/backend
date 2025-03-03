import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserType } from '../users/types/user.type'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') as string,
        })
    }

    validate(payload: object) {
        if (payload && 'email' in payload && 'sub' in payload) {
            return { email: payload.email as string, user: payload.sub as UserType }
        }
    }
}
