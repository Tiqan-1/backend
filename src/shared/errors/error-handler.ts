import { BadRequestException } from '@nestjs/common'

/**
 * An error handler to be used on functions where new ObjectId('id received from client') is called.
 * @constructor
 */
export function HandleBsonErrors() {
    return function <T>(
        _target: object, // The prototype of the class
        propertyKey: string, // The name of the method being decorated
        descriptor: TypedPropertyDescriptor<T> // Typed descriptor for the method
    ) {
        // Retain the original method
        const originalMethod = descriptor.value as unknown as (...args: unknown[]) => Promise<unknown>

        // Replace the original method with an error-handling wrapper
        descriptor.value = async function (
            ...args: Parameters<typeof originalMethod>
        ): Promise<ReturnType<typeof originalMethod>> {
            try {
                const result = originalMethod.apply(this, args)
                if (result instanceof Promise) {
                    try {
                        return await result
                    } catch (error) {
                        return handleBsonError(error, propertyKey)
                    }
                }
                return result
            } catch (error) {
                handleBsonError(error, propertyKey)
            }
        } as unknown as T

        return descriptor
    }
}

function handleBsonError(error: unknown, methodName: string): never {
    if (error instanceof Error && error.name === 'BSONError') {
        console.error(`BSONError in method: ${methodName}`)
        throw new BadRequestException('Id validation error.')
    }
    throw error
}
