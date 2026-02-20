import mongoose, { Schema, Document, Types } from 'mongoose';

export enum InwardStatus {
    RECEIVED = 'Received',
    SAMPLES_TAKEN = 'Samples Taken',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum InwardType {
    FABRIC = 'Fabric',
    ACCESSORY = 'Accessory',
}

export interface IInward extends Document {
    inwardDate: Date;
    referenceNo: string; // Internal sequential number (Auto-increment logic in service)
    challanNo?: string;  // Vendor's Challan No
    billNo?: string;     // Vendor's Bill No
    type: InwardType;

    partyId: Types.ObjectId; // Dyeing House or Supplier
    clientId: Types.ObjectId; // LUX / RUPA (The client this material belongs to)

    items: Array<{
        materialId: Types.ObjectId; // Ref: Material (Fabric: Interlock/Rib)
        color: string;
        diameter?: string; // e.g., '32', '34' (Fabric specific)
        pcs?: number;      // Pieces field after diameter
        gsm?: number;      // Fabric specific
        quantity: number;  // Received quantity
        unit: string;      // KG or PCS
        rolls?: number;    // Number of rolls/packages
        lotNo?: string;    // External Lot/Batch Number
        remarks?: string;
        status: 'Pending' | 'Approved' | 'Rejected'; // Line item status
        rejectionCause?: 'Color' | 'Weight' | '';
        returnStatus?: 'Pending' | 'Returned' | '';
        samplePassed?: boolean; // For Fabric QC
        cuttingSize?: number; // In CM
    }>;

    totalQuantity: number; // Aggregate total
    status: InwardStatus;  // Overall status
    remarks?: string;
    lotNo?: string;
    images?: string[]; // Array of image URLs/paths

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const InwardSchema: Schema = new Schema(
    {
        inwardDate: { type: Date, required: true, default: Date.now },
        referenceNo: { type: String, required: true, unique: true, index: true },
        challanNo: { type: String },
        billNo: { type: String },
        type: { type: String, enum: Object.values(InwardType), required: true },

        partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },

        items: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
                color: { type: String, required: true },
                diameter: { type: String },
                pcs: { type: Number, default: 0 },
                gsm: { type: Number, default: 0 },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                rolls: { type: Number },
                lotNo: { type: String },
                remarks: { type: String },
                status: {
                    type: String,
                    enum: ['Pending', 'Approved', 'Rejected'],
                    default: 'Pending'
                },
                rejectionCause: { type: String, enum: ['Color', 'Weight', ''], default: '' },
                returnStatus: { type: String, enum: ['Pending', 'Returned', ''], default: '' },
                returnChallanNo: { type: String },
                rereceiveChallanNo: { type: String },
                returnDate: { type: Date },
                returnImages: { type: [String], default: [] },
                samplePassed: { type: Boolean, default: false },
                cuttingSize: { type: Number },
                history: [{
                    action: { type: String, enum: ['Rejected', 'Returned', 'Rereceived'] },
                    date: { type: Date, default: Date.now },
                    challanNo: String,
                    images: [String],
                    remarks: String,
                    quantity: Number,
                    color: String
                }]
            }
        ],

        totalQuantity: { type: Number, default: 0 },
        status: {
            type: String,
            enum: Object.values(InwardStatus),
            default: InwardStatus.RECEIVED
        },
        remarks: { type: String },
        lotNo: { type: String },
        images: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        minimize: false
    }
);

// Pre-save to calculate total
InwardSchema.pre<IInward>('save', async function (this: IInward) {
    if (this.items && this.items.length > 0) {
        this.totalQuantity = this.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    }
});

// Forcing model refresh in development to avoid schema caching issues
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Inward;
}

const Inward = mongoose.models.Inward || mongoose.model<IInward>('Inward', InwardSchema);
export default Inward;
