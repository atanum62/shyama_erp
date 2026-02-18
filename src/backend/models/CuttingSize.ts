import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICuttingSize extends Document {
    lotNo: string;
    color: string;
    weight: number;
    cuttingsize: number; // The cutting size (75-110 cm)
    inwardId: Types.ObjectId;
    itemId: Types.ObjectId;
    materialId: Types.ObjectId;
    challanNo: string;
    createdAt: Date;
    updatedAt: Date;
}

const CuttingSizeSchema: Schema = new Schema(
    {
        lotNo: { type: String, required: true },
        color: { type: String, required: true },
        weight: { type: Number, required: true },
        cuttingsize: { type: Number, required: true },
        inwardId: { type: Schema.Types.ObjectId, ref: 'Inward', required: true },
        itemId: { type: Schema.Types.ObjectId, required: true },
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        challanNo: { type: String, required: true }
    },
    {
        timestamps: true,
    }
);

// Add index for easy lookup
CuttingSizeSchema.index({ inwardId: 1, itemId: 1 }, { unique: true });

const CuttingSize = mongoose.models.CuttingSize || mongoose.model<ICuttingSize>('CuttingSize', CuttingSizeSchema);
export default CuttingSize;
