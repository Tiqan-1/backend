export type ElementType = {
    question?: string
    id: string
    type: 'text' | 'number' | 'select' | 'choice'
    answer?: string | string[]
    multiple?: boolean
    score?: number
}

export type SlideType = {
    elements: ElementType[]
}
export type FormType = {
    startSlide?: SlideType
    endSlide?: SlideType
    slides: SlideType[]
    settings: Record<string, unknown>
}
