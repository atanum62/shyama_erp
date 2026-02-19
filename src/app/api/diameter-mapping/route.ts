import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiameterMapping from '@/backend/models/DiameterMapping';

export async function GET() {
    try {
        await dbConnect();
        const data = await DiameterMapping.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.productName || !body.mappings) {
            return NextResponse.json({ error: 'productName and mappings are required' }, { status: 400 });
        }

        // Prevent duplicates
        const existing = await DiameterMapping.findOne({ productName: { $regex: new RegExp(`^${body.productName}$`, 'i') } });
        if (existing) {
            return NextResponse.json({ error: 'Mapping for this product already exists.' }, { status: 409 });
        }

        const doc = await DiameterMapping.create(body);
        return NextResponse.json(doc, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
