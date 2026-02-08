import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
    name: string;
    description?: string;
    imageUrl?: string;
    imagePublicId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ItemSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String },
        imagePublicId: { type: String },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
