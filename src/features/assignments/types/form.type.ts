export type BaseQuestion = { id: string; question?: string; score?: number }
export type SelectionQuestion = { type: 'select'; answer?: string }
export type NumberQuestion = { type: 'number'; answer?: string }
export type ChoiceQuestion = { type: 'choice'; multiple?: boolean; answer?: string[] }
export type Question = BaseQuestion & (SelectionQuestion | NumberQuestion | ChoiceQuestion)

export type SlideType = {
    elements: Question[]
}
export type FormType = {
    startSlide?: SlideType
    endSlide?: SlideType
    slides: SlideType[]
    settings: Record<string, unknown>
}
