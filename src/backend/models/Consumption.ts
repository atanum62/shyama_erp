import mongoose, { Schema, Document } from 'mongoose';

export interface IConsumption extends Document {
    productName: string; // e.g., 'T-Shirt', 'Pant'
    unit: string; // e.g., 'Dozen', 'Pcs'
    // Components definition for this product (e.g. ['Body', 'Rib', 'Wastage'])
    definedComponents: string[];

    // Data per size
    variations: {
        size: string; // '75', '80', 'L', 'XL'
        // Map component name to consumption value (always in KG/unit effectively, or allow unit specification)
        // Let's store simple objects: { name: 'Body', value: 1.2, unit: 'kg' }
        consumption: {
            name: string;
            value: number;
            unit: string; // 'kg', 'g'
        }[];
    }[];

    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConsumptionSchema: Schema = new Schema(
    {
        productName: { type: String, required: true, unique: true },
        unit: { type: String, default: 'Dozen' },
        definedComponents: [{ type: String }], // To keep order of columns in UI

        variations: [
            {
                size: { type: String, required: true },
                consumption: [
                    {
                        name: { type: String, required: true },
                        value: { type: Number, required: true, default: 0 },
                        unit: { type: String, default: 'kg' } // Defaulting to kg for consistency
                    }
                ]
            }
        ],
        remarks: { type: String }
    },
    {
        timestamps: true
    }
);

const Consumption = mongoose.models.Consumption || mongoose.model<IConsumption>('Consumption', ConsumptionSchema);
export default Consumption;
