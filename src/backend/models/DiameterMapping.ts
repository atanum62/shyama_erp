import mongoose, { Schema, Document } from 'mongoose';

export interface IDiameterMapping extends Document {
    productName: string;   // e.g. 'T-Shirt', 'Pant'
    mappings: {
        diameter: number;  // fabric diameter, e.g. 15
        size: string;      // product size cut from it, e.g. '80'
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const DiameterMappingSchema: Schema = new Schema(
    {
        productName: { type: String, required: true, unique: true, trim: true },
        mappings: [
            {
                diameter: { type: Number, required: true },
                size: { type: String, required: true, trim: true }
            }
        ]
    },
    { timestamps: true }
);

const DiameterMapping =
    mongoose.models.DiameterMapping ||
    mongoose.model<IDiameterMapping>('DiameterMapping', DiameterMappingSchema);

export default DiameterMapping;
