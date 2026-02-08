import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Inward, { InwardStatus } from '@/backend/models/Inward';

export async function GET() {
    try {
        await dbConnect();
        // Populate party and material details
        const inwards = await Inward.find()
            .populate('partyId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(inwards);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Generate a simple Challan number if not provided
        if (!body.challanNo) {
            body.challanNo = `CH-${Date.now().toString().slice(-6)}`;
        }

        const inward = await Inward.create(body);
        return NextResponse.json(inward, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
