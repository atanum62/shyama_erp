import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description?: string;
    pricePerDozen: number;
    pricePerPiece: number;
    image?: string;
    bom?: { material: string; quantity: number; unit: string; wastage: number }[];
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
        bom: [{
            material: { type: String, required: true },
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            wastage: { type: Number, default: 0 },
        }]
    },
    { timestamps: true }
);

// Delete cached model to avoid stale middleware (pre-save hooks) from hot-reload
delete (mongoose.models as any).Product;

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
