import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PaymentType {
    RECEIVABLE = 'Receivable', // From LUX (Client)
    PAYABLE = 'Payable',       // To Stitcher/Dyeing House
}

export enum PaymentStatus {
    PENDING = 'Pending',
    PARTIAL = 'Partial',
    COMPLETED = 'Completed',
    OVERDUE = 'Overdue',
}

export interface IPayment extends Document {
    referenceId: string; // Invoice No / Bill No / Work Order No
    partyId: Types.ObjectId;
    amount: number;
    paidAmount: number;
    balanceAmount: number; // Derived

    dueDate: Date;
    type: PaymentType;
    status: PaymentStatus;

    description?: string;
    onModel: 'Party' | 'Stitcher';
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
    {
        referenceId: { type: String, required: true }, // Not unique globally, maybe just invoice no
        partyId: { type: Schema.Types.ObjectId, required: true, refPath: 'onModel' },
        onModel: { type: String, required: true, enum: ['Party', 'Stitcher'] },
        amount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },

        dueDate: { type: Date },
        type: { type: String, enum: Object.values(PaymentType), required: true },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING
        },

        description: { type: String },
    },
    {
        timestamps: true,
    }
);

// Pre-save calc
PaymentSchema.pre<IPayment>('save', async function () {
    this.balanceAmount = this.amount - (this.paidAmount || 0);
    if (this.balanceAmount <= 0) {
        this.status = PaymentStatus.COMPLETED;
        this.balanceAmount = 0;
    } else if (this.paidAmount > 0) {
        this.status = PaymentStatus.PARTIAL;
    }
});

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
