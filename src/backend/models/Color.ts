import mongoose, { Schema, Document } from 'mongoose';

export interface IColor extends Document {
    name: string;
    code: string;
    hexCode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ColorSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, index: true, uppercase: true },
        hexCode: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const Color = mongoose.models.Color || mongoose.model<IColor>('Color', ColorSchema);
export default Color;
