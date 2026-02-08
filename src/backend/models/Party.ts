import mongoose, { Schema, Document } from 'mongoose';

export enum PartyType {
    CLIENT = 'Client', // e.g., LUX, Rupa
    DYEING_HOUSE = 'DyeingHouse',
    STITCHER = 'Stitcher',
    SUPPLIER = 'Supplier' // For other accessories
}

export interface IParty extends Document {
    name: string;
    code: string;
    type: PartyType;
    contactPerson?: string;
    contactNumber?: string;
    address?: string;
    gstin?: string; // Tax ID
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PartySchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, index: true, uppercase: true },
        type: { type: String, enum: Object.values(PartyType), required: true },
        contactPerson: { type: String },
        contactNumber: { type: String },
        address: { type: String },
        gstin: { type: String, uppercase: true },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// Prevent re-compilation error in Next.js hot reload
const Party = mongoose.models.Party || mongoose.model<IParty>('Party', PartySchema);
export default Party;
