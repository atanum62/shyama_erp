import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DeliveryChallan from '@/backend/models/DeliveryChallan';

export async function GET() {
    try {
        await dbConnect();
        const challans = await DeliveryChallan.find()
            .populate('clientId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(challans);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.challanNo) {
            body.challanNo = `DC-${Date.now().toString().slice(-6)}`;
        }

        const challan = await DeliveryChallan.create(body);
        return NextResponse.json(challan, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
