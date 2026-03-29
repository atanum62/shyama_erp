import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BOM from '@/backend/models/BOM';

export async function GET() {
    try {
        await dbConnect();
        const boms = await BOM.find({}).sort({ productName: 1 });
        return NextResponse.json(boms);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const existing = await BOM.findOne({ productName: body.productName });
        if (existing) {
            return NextResponse.json({ error: 'BOM for this product already exists' }, { status: 400 });
        }
        const bom = await BOM.create(body);
        return NextResponse.json(bom, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


