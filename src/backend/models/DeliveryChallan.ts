import mongoose, { Schema, Document, Types } from 'mongoose';

export enum DeliveryStatus {
    DRAFT = 'Draft',
    DISPATCHED = 'Dispatched', // Left premise
    DELIVERED = 'Delivered',   // Received by LUX
    RETURNED = 'Returned',     // Rejected by LUX
}

export interface IDeliveryChallan extends Document {
    challanNo: string; // Internal sequence
    deliveryDate: Date;
    clientId: Types.ObjectId; // LUX

    items: Array<{
        itemType: 'FinishedGood' | 'RawMaterial'; // Usually Finished Good
        materialId: Types.ObjectId; // Ref Material or CuttingOrder/StitchingOrder
        description: string;
        lotNo?: string;
        size?: string;
        quantity: number;
        unit: string;
        remarks?: string;
    }>;

    vehicleNo?: string;
    driverName?: string;
    gatePassNo?: string;

    status: DeliveryStatus;

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryChallanSchema: Schema = new Schema(
    {
        challanNo: { type: String, required: true, unique: true, index: true },
        deliveryDate: { type: Date, required: true, default: Date.now },
        clientId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },

        items: [{
            itemType: { type: String, enum: ['FinishedGood', 'RawMaterial'], required: true },
            materialId: { type: Schema.Types.ObjectId, ref: 'Material' }, // Optional
            description: { type: String },
            lotNo: { type: String },
            size: { type: String },
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            remarks: { type: String }
        }],

        vehicleNo: { type: String },
        driverName: { type: String },
        gatePassNo: { type: String },

        status: {
            type: String,
            enum: Object.values(DeliveryStatus),
            default: DeliveryStatus.DRAFT
        },

        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    }
);

const DeliveryChallan = mongoose.models.DeliveryChallan || mongoose.model<IDeliveryChallan>('DeliveryChallan', DeliveryChallanSchema);
export default DeliveryChallan;
