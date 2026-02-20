import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReturnHistory extends Document {
    inwardId: Types.ObjectId;
    itemId: string;
    partyId: Types.ObjectId;
    materialId: Types.ObjectId;
    lotNo: string;
    challanNo: string; // Original inward challan

    // Final state fields
    originalColor: string;
    previousColor: string; // Color before the last rereceive
    newColor: string;
    originalQuantity: number;
    receivedQuantity: number;

    // Operation details
    returnDate: Date;
    returnChallanNo: string;
    returnImages: string[];

    rereceiveDate: Date;
    rereceiveChallanNo: string;
    rereceiveImages: string[];

    // Sequence of events
    history: Array<{
        action: 'Rejected' | 'Returned' | 'Rereceived';
        date: Date;
        challanNo?: string;
        images?: string[];
        remarks?: string;
        quantity?: number;
        color?: string;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const ReturnHistorySchema: Schema = new Schema(
    {
        inwardId: { type: Schema.Types.ObjectId, ref: 'Inward', required: true },
        itemId: { type: String, required: true },
        partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        lotNo: { type: String },
        challanNo: { type: String },

        originalColor: { type: String },
        previousColor: { type: String },
        newColor: { type: String },
        originalQuantity: { type: Number },
        receivedQuantity: { type: Number },

        returnDate: { type: Date },
        returnChallanNo: { type: String },
        returnImages: { type: [String], default: [] },

        rereceiveDate: { type: Date },
        rereceiveChallanNo: { type: String },
        rereceiveImages: { type: [String], default: [] },

        history: [
            {
                action: { type: String, enum: ['Rejected', 'Returned', 'Rereceived'] },
                date: { type: Date, default: Date.now },
                challanNo: String,
                images: [String],
                remarks: String,
                quantity: Number,
                color: String
            }
        ]
    },
    {
        timestamps: true
    }
);

const ReturnHistory = mongoose.models.ReturnHistory || mongoose.model<IReturnHistory>('ReturnHistory', ReturnHistorySchema);
export default ReturnHistory;
