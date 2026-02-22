import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICuttingSheetRow {
    srNo: number;
    slipNo: string;         // e.g., "1-10", "11-20"
    totalSlip: number;      // Manual entry
    size: string;           // Manual dropdown from Master
    doz: number;            // Manual entry
    pcs: number;            // Auto: doz * 12
    weight: number;         // Manual entry
    wastage: number;        // Manual entry
    inRB: number;           // Auto from consumption
    folRB: number;          // Auto from consumption
    totalRowWeight: number; // Auto: weight + wastage + inRB + folRB
    remarks?: string;
}

export interface ICuttingSheet extends Document {
    sheetNo: string;          // Auto-generated sheet number
    date: Date;               // Single date for the whole sheet (entered once)

    // Header info
    lotNo?: string;
    challanNo?: string;       // Renamed from inwardChallanNo

    // Product & Technical info
    productName: string;      // e.g., "Vest", "T-Shirt"
    gsm?: string;             // Added
    totalRolls?: number;      // Renamed from pcs
    quality?: string;         // Added
    totalWeight?: number;     // Added
    color?: string;           // Added (Total Passed Color)

    // Rows
    rows: ICuttingSheetRow[];

    // Sheet-level summary totals
    grandTotalDozens: number;
    grandTotalPieces: number;
    totalFabricUsedKg: number;
    totalWastageKg: number;
    totalRippedKg: number;

    status: 'Draft' | 'Submitted' | 'Approved';
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RowSchema = new Schema({
    srNo: { type: Number },
    slipNo: { type: String },
    totalSlip: { type: Number, default: 0 },
    size: { type: String },
    doz: { type: Number, default: 0 },
    pcs: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    wastage: { type: Number, default: 0 },
    inRB: { type: Number, default: 0 },
    folRB: { type: Number, default: 0 },
    totalRowWeight: { type: Number, default: 0 },
    remarks: { type: String },
}, { _id: false });

const CuttingSheetSchema: Schema = new Schema(
    {
        sheetNo: { type: String, required: true, unique: true, index: true },
        date: { type: Date, required: true, default: Date.now },

        lotNo: { type: String },
        challanNo: { type: String },

        productName: { type: String, required: true, default: '' },
        gsm: { type: String },
        totalRolls: { type: Number },
        quality: { type: String },
        totalWeight: { type: Number },
        color: { type: String },

        rows: [RowSchema],

        grandTotalDozens: { type: Number, default: 0 },
        grandTotalPieces: { type: Number, default: 0 },
        totalFabricUsedKg: { type: Number, default: 0 },
        totalWastageKg: { type: Number, default: 0 },
        totalRippedKg: { type: Number, default: 0 },

        status: { type: String, enum: ['Draft', 'Submitted', 'Approved'], default: 'Draft' },
        remarks: { type: String },
    },
    { timestamps: true }
);

const CuttingSheet = mongoose.models.CuttingSheet || mongoose.model<ICuttingSheet>('CuttingSheet', CuttingSheetSchema);
export default CuttingSheet;
