import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'

export type FormElementDocument = HydratedDocument<FormElement>

@Schema()
export class FormElement {
    @Prop({ required: true })
    type: string

    @Prop()
    name?: string

    @Prop()
    question?: string

    @Prop({ type: [String] })
    choices?: string[]

    @Prop({ type: [String] })
    options?: string[]

    // Answer can be a string for 'select', an array for 'multi choice', ...
    @Prop({ type: MongooseSchema.Types.Mixed })
    answer?: object

    @Prop()
    score?: number

    @Prop()
    reason?: string // answer illustration

    @Prop()
    multiple?: boolean

    // TODO: Add other fields from form builder like 'text', 'min', 'max'
    @Prop()
    text?: string
}
export const FormElementSchema = SchemaFactory.createForClass(FormElement)

export type SlideDocument = HydratedDocument<Slide>

@Schema()
export class Slide {
    @Prop({ type: [FormElementSchema] })
    elements: FormElementDocument[]
}
export const SlideSchema = SchemaFactory.createForClass(Slide)

export type AssignmentFormDocument = HydratedDocument<AssignmentForm>

@Schema()
export class AssignmentForm {
    @Prop({ type: Object })
    settings: Record<string, unknown>

    @Prop({ type: SlideSchema })
    startSlide?: SlideDocument

    @Prop({ type: [SlideSchema], default: [] })
    slides: SlideDocument[]

    @Prop({ type: SlideSchema })
    endSlide?: SlideDocument
}
export const AssignmentFormSchema = SchemaFactory.createForClass(AssignmentForm)
