import mongoose, { Schema, Document, Types } from 'mongoose';

export enum CuttingStatus {
    DRAFT = 'Draft',
    SUBMITTED = 'Submitted', // Submitted to Client (LUX) for approval
    APPROVED = 'Approved',   // Approved by Client
    REJECTED = 'Rejected',   // Rejected by Client
    COMPLETED = 'Completed', // Cutting done locally
}

export interface ICuttingOrder extends Document {
    orderNo: string; // Auto-generated
    inwardId: Types.ObjectId; // Link to specific Fabric Inward
    fabricId: Types.ObjectId; // Redundant but useful for query

    cuttingSheet: Array<{
        size: string; // e.g., '80', '85', '90', '95', '100'
        quantityDozens: number;
        quantityPieces: number; // calculated
    }>;

    wastageKg: number;
    rippedFabricKg: number;
    totalFabricUsedKg: number;

    status: CuttingStatus;
    clientApprovalDate?: Date;
    remarks?: string;

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CuttingOrderSchema: Schema = new Schema(
    {
        orderNo: { type: String, required: true, unique: true, index: true },
        inwardId: { type: Schema.Types.ObjectId, ref: 'Inward', required: true },
        fabricId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },

        cuttingSheet: [{
            size: { type: String, required: true },
            quantityDozens: { type: Number, required: true },
            quantityPieces: { type: Number, required: true }
        }],

        wastageKg: { type: Number, default: 0 },
        rippedFabricKg: { type: Number, default: 0 },
        totalFabricUsedKg: { type: Number, required: true },

        status: {
            type: String,
            enum: Object.values(CuttingStatus),
            default: CuttingStatus.DRAFT
        },
        clientApprovalDate: { type: Date },
        remarks: { type: String },

        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    }
);

const CuttingOrder = mongoose.models.CuttingOrder || mongoose.model<ICuttingOrder>('CuttingOrder', CuttingOrderSchema);
export default CuttingOrder;
