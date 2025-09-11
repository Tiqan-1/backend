import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose'

export type SlideDocument = HydratedDocument<Slide>

@Schema()
export class Slide {
    @Prop({ type: MongooseSchema.Types.Map, of: MongooseSchema.Types.Mixed })
    elements: Map<string, unknown>
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
