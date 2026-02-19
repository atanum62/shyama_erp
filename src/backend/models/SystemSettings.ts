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
    },
    { timestamps: true }
);

const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
export default SystemSettings;
