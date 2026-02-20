import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICuttingSheetRow {
    srNo: number;
    color: string;
    materialName: string;
    lotNo?: string;
    // Size-wise dozens
    s75?: number; s80?: number; s85?: number; s90?: number; s95?: number;
    s100?: number; s105?: number; s110?: number;
    // Totals (calculated)
    totalDozens: number;
    totalPieces: number;
    // Fabric usage
    fabricUsedKg?: number;
    wastageKg?: number;
    rippedKg?: number;
    remarks?: string;
}

export interface ICuttingSheet extends Document {
    sheetNo: string;          // Auto-generated sheet number
    date: Date;               // Single date for the whole sheet (entered once)

    // Header info
    partyId: Types.ObjectId;  // Dyeing House / Party
    clientId: Types.ObjectId; // LUX / Rupa
    lotNo?: string;
    inwardChallanNo?: string;

    // Product info
    productName: string;      // e.g., "Vest", "T-Shirt"
    style?: string;

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
    color: { type: String, required: true },
    materialName: { type: String, default: '' },
    lotNo: { type: String },
    s75: { type: Number, default: 0 },
    s80: { type: Number, default: 0 },
    s85: { type: Number, default: 0 },
    s90: { type: Number, default: 0 },
    s95: { type: Number, default: 0 },
    s100: { type: Number, default: 0 },
    s105: { type: Number, default: 0 },
    s110: { type: Number, default: 0 },
    totalDozens: { type: Number, default: 0 },
    totalPieces: { type: Number, default: 0 },
    fabricUsedKg: { type: Number, default: 0 },
    wastageKg: { type: Number, default: 0 },
    rippedKg: { type: Number, default: 0 },
    remarks: { type: String },
}, { _id: false });

const CuttingSheetSchema: Schema = new Schema(
    {
        sheetNo: { type: String, required: true, unique: true, index: true },
        date: { type: Date, required: true, default: Date.now },

        partyId: { type: Schema.Types.ObjectId, ref: 'Party' },
        clientId: { type: Schema.Types.ObjectId, ref: 'Party' },
        lotNo: { type: String },
        inwardChallanNo: { type: String },

        productName: { type: String, required: true, default: '' },
        style: { type: String },

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
