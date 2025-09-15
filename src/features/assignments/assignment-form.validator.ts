import { FormType } from './types/form.type'

export class AssignmentFormValidator {
    static isFormStructureValid(form?: unknown): form is FormType {
        return false
    }
}
