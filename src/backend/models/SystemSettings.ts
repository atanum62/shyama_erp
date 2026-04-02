import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    companyName: string;
    erpName: string;
    address: string;
    contactNumber: string;
    email?: string;
    gstNumber?: string;
    panNumber?: string;
    bankDetails: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        branchName: string;
    };
    receiverEmail: string;
    emailEnabled: boolean;

    // Notification Thresholds (in days)
    redyeThreshold: number;
    fabricToCuttingThreshold: number;
    cuttingToAccessoryThreshold: number;
    stitchingDelayThreshold: number;
    accessoryToProductThreshold: number;
    paymentThreshold: number;

    updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema(
    {
        companyName: { type: String, required: true, default: 'SHYAMA INDUSTRIES' },
        erpName: { type: String, required: true, default: 'SHYAMA ERP' },
        address: { type: String, default: '' },
        contactNumber: { type: String, default: '' },
        email: { type: String, default: '' },
        gstNumber: { type: String, default: '' },
        panNumber: { type: String, default: '' },
        bankDetails: {
            bankName: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            ifscCode: { type: String, default: '' },
            branchName: { type: String, default: '' },
        },
        receiverEmail: { type: String, default: '' },
        emailEnabled: { type: Boolean, default: true },

        // Notification Threshold Defaults
        redyeThreshold: { type: Number, default: 15 },
        fabricToCuttingThreshold: { type: Number, default: 10 },
        cuttingToAccessoryThreshold: { type: Number, default: 5 },
        stitchingDelayThreshold: { type: Number, default: 15 },
        accessoryToProductThreshold: { type: Number, default: 20 },
        paymentThreshold: { type: Number, default: 15 },
    },
    { timestamps: true }
);

const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
export default SystemSettings;
