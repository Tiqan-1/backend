import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class FormElement {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    type: string;

    @Prop()
    name?: string;

    @Prop()
    question?: string;

    @Prop({ type: [String] })
    choices?: string[];

    @Prop({ type: [String] })
    options?: string[];

    // Answer can be a string for 'select', an array for 'multi choice', ...
    @Prop({ type: MongooseSchema.Types.Mixed })
    answer?: any;

    @Prop()
    score?: number;

    @Prop()
    reason?: string; // answer illustration

    @Prop()
    multiple?: boolean;
    
    // TODO: Add other fields from form builder like 'text', 'min', 'max'
    @Prop()
    text?: string;
}
export const FormElementSchema = SchemaFactory.createForClass(FormElement);

@Schema({ _id: false })
export class Slide {
    @Prop({ type: [FormElementSchema] })
    elements: FormElement[];
}
export const SlideSchema = SchemaFactory.createForClass(Slide);

@Schema({ _id: false })
export class AssignmentForm {
    @Prop({ type: Object })
    settings: Record<string, any>;

    @Prop({ type: SlideSchema })
    startSlide?: Slide;

    @Prop({ type: [SlideSchema], default: [] })
    slides: Slide[];

    @Prop({ type: SlideSchema })
    endSlide?: Slide;
}
export const AssignmentFormSchema = SchemaFactory.createForClass(AssignmentForm);