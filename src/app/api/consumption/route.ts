import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Consumption from '@/backend/models/Consumption';

export async function GET() {
    try {
        await dbConnect();
        const consumptions = await Consumption.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(consumptions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Ensure consistency
        if (body.productName && body.definedComponents && body.variations) {
            // Check for existing
            const existing = await Consumption.findOne({ productName: { $regex: new RegExp(`^${body.productName}$`, 'i') } });
            if (existing) {
                return NextResponse.json({ error: 'Product Consumption already exists with this name.' }, { status: 409 });
            }

            const consumption = await Consumption.create(body);
            return NextResponse.json(consumption, { status: 201 });
        } else {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
