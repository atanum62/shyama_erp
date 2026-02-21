import mongoose, { Schema, Document, Types } from 'mongoose';

export enum WorkOrderStatus {
    DRAFT = 'Draft',
    ISSUED = 'Issued', // Sent to Stitcher
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed', // All finished goods received
    CANCELLED = 'Cancelled',
}

export interface IStitchingOrder extends Document {
    workOrderNo: string; // Auto-generated
    stitcherId: Types.ObjectId; // Party who will receive this job
    clientId: Types.ObjectId;   // For whom (LUX) for reporting

    description: string;
    expectedDeliveryDate?: Date;

    issuedItems: Array<{
        itemType: 'Fabric' | 'Accessory' | 'CuttingPanel';
        materialId: Types.ObjectId; // Ref Material or CuttingOrder ID?
        // If CuttingPanel, materialId points to CuttingOrder (conceptual link) or derived Item
        quantity: number;
        unit: string;
        remarks?: string;
    }>;

    receivedQuantity: number; // Finished goods received so far
    rejectedQuantity: number; // Rejected pieces
    reworkQuantity: number;   // Need rework

    totalPaymentDue: number;  // Calculated based on rate/pc
    status: WorkOrderStatus;

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const StitchingOrderSchema: Schema = new Schema(
    {
        workOrderNo: { type: String, required: true, unique: true, index: true },
        stitcherId: { type: Schema.Types.ObjectId, ref: 'Stitcher', required: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },

        description: { type: String },
        expectedDeliveryDate: { type: Date },

        issuedItems: [{
            itemType: { type: String, enum: ['Fabric', 'Accessory', 'CuttingPanel'], required: true },
            materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            remarks: { type: String }
        }],

        receivedQuantity: { type: Number, default: 0 },
        rejectedQuantity: { type: Number, default: 0 },
        reworkQuantity: { type: Number, default: 0 },

        totalPaymentDue: { type: Number, default: 0 },

        status: {
            type: String,
            enum: Object.values(WorkOrderStatus),
            default: WorkOrderStatus.DRAFT
        },

        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    }
);

const StitchingOrder = mongoose.models.StitchingOrder || mongoose.model<IStitchingOrder>('StitchingOrder', StitchingOrderSchema);
export default StitchingOrder;
