import mongoose, { Schema, Document } from 'mongoose';

export enum MaterialCategory {
    FABRIC = 'Fabric',
    ACCESSORY = 'Accessory',
}

export interface IMaterial extends Document {
    name: string;
    code: string;
    category: MaterialCategory;
    subType?: string; // Interlock, Rib, Thread, Button
    unit: string; // kg, meters, pcs
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, index: true, uppercase: true },
        category: { type: String, enum: Object.values(MaterialCategory), required: true },
        subType: { type: String }, // e.g., 'Interlock', 'Rib', 'Elastic', 'Label'
        unit: { type: String, required: true }, // e.g., 'KG', 'MTR', 'PCS'
        description: { type: String },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const Material = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
export default Material;
