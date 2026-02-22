import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description?: string;
    pricePerDozen: number;
    pricePerPiece: number;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, trim: true },
        pricePerDozen: { type: Number, required: true, default: 0 },
        pricePerPiece: { type: Number, required: true, default: 0 },
        image: { type: String, default: '' },
    },
    { timestamps: true }
);

// Delete cached model to avoid stale middleware (pre-save hooks) from hot-reload
delete (mongoose.models as any).Product;

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
