import mongoose, { Schema, Document } from 'mongoose';

export interface IStitchingRate {
    productId?: string;
    category: string;
    rate: number;
}

export interface IStitcher extends Document {
    name: string;
    code: string;
    contactPerson?: string;
    contactNumber?: string;
    address?: string;
    gstin?: string;
    bankDetails: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        branchName: string;
    };
    stitchingRates: IStitchingRate[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StitchingRateSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Consumption' },
    category: { type: String, required: true },
    rate: { type: Number, required: true, default: 0 }
});

const StitcherSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, index: true, uppercase: true },
        contactPerson: { type: String },
        contactNumber: { type: String },
        address: { type: String },
        gstin: { type: String, uppercase: true },
        bankDetails: {
            bankName: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            ifscCode: { type: String, default: '' },
            branchName: { type: String, default: '' },
        },
        stitchingRates: [StitchingRateSchema],
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const Stitcher = mongoose.models.Stitcher || mongoose.model<IStitcher>('Stitcher', StitcherSchema);
export default Stitcher;
