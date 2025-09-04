import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import { ObjectId } from '../repository/types'

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
    constructor(private readonly i18n: I18nService) {}

    transform(value: string): ObjectId {
        if (ObjectId.isValid(value)) {
            return new ObjectId(value)
        }
        throw new BadRequestException(this.i18n.t('validation.mongoId'))
    }
}
