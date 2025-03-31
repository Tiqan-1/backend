import { FileTypeValidator, HttpStatus, MaxFileSizeValidator } from '@nestjs/common'
import { ParseFilePipe } from '@nestjs/common/pipes/file/parse-file.pipe'

export class PhotoFilePipe extends ParseFilePipe {
    constructor() {
        super({
            validators: [
                new FileTypeValidator({ fileType: /(jpeg|jpg|png|gif|bmp|webp)$/ }),
                new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            ],
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    }
}
