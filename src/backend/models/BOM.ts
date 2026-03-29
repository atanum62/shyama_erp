import mongoose, { Schema, Document } from 'mongoose';

export interface IBOM extends Document {
    productName: string;
    unit: string; // Dozen or Pcs
    materials: {
        materialId?: mongoose.Types.ObjectId;
        name: string;
        quantity: number;
        unit: string; // PCS, etc.
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const BOMSchema: Schema = new Schema(
    {
        productName: { type: String, required: true, unique: true },
        unit: { type: String, default: 'Dozen' }, // Base unit for which this BOM is defined
        materials: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
                name: { type: String, required: true },
                quantity: { type: Number, required: true, default: 0 },
                unit: { type: String, default: 'PCS' }
            }
        ]
    },
    {
        timestamps: true
    }
);

const BOM = mongoose.models.BOM || mongoose.model<IBOM>('BOM', BOMSchema);
export default BOM;
