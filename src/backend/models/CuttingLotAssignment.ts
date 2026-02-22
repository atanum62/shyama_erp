import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICuttingLotAssignment extends Document {
    lotNo: string;
    inwardId: Types.ObjectId;
    itemId: Types.ObjectId;
    productName: string;
    diameter: string;
    usedWeight: number;
    totalDozen: number;
    totalPieces: number;
    color: string;
    materialId: Types.ObjectId;
    productSize: string;

    // Consumption Snapshot (from Master Data at time of entry)
    consumptionPerDozen: number;
    wastageWeight: number;
    interlockWeight: number;
    ribConsumption: number;

    date: Date;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CuttingLotAssignmentSchema: Schema = new Schema(
    {
        lotNo: { type: String, required: true, index: true },
        inwardId: { type: Schema.Types.ObjectId, ref: 'Inward', required: true },
        itemId: { type: Schema.Types.ObjectId, required: true },
        productName: { type: String, required: true },
        diameter: { type: String, required: true },
        usedWeight: { type: Number, required: true },
        totalDozen: { type: Number, required: true },
        totalPieces: { type: Number, required: true },
        color: { type: String, required: true },
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        productSize: { type: String, required: true },

        consumptionPerDozen: { type: Number, required: true },
        wastageWeight: { type: Number, required: true },
        interlockWeight: { type: Number, required: true },
        ribConsumption: { type: Number, required: true },

        date: { type: Date, default: Date.now },
        remarks: { type: String }
    },
    {
        timestamps: true,
    }
);

const CuttingLotAssignment = mongoose.models.CuttingLotAssignment || mongoose.model<ICuttingLotAssignment>('CuttingLotAssignment', CuttingLotAssignmentSchema);
export default CuttingLotAssignment;
