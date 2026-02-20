import mongoose, { Schema, Document } from 'mongoose';

export interface IRibQuantity extends Document {
    cuttingSize: number; // 75-110
    inRBQty: number;     // Quantity for In R/B per dozen (kg)
    folRBQty: number;    // Quantity for Fol R/B per dozen (kg)
}

const RibQuantitySchema: Schema = new Schema(
    {
        cuttingSize: {
            type: Number,
            required: true,
            unique: true,
            min: 75,
            max: 110
        },
        inRBQty: {
            type: Number,
            required: true
        },
        folRBQty: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const RibQuantity = mongoose.models.RibQuantity || mongoose.model<IRibQuantity>('RibQuantity', RibQuantitySchema);
export default RibQuantity;
