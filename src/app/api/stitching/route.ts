import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StitchingOrder from '@/backend/models/StitchingOrder';

export async function GET() {
    try {
        await dbConnect();
        const stitchingOrders = await StitchingOrder.find()
            .populate('stitcherId', 'name')
            .populate('clientId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(stitchingOrders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Generate Work Order Number
        if (!body.workOrderNo) {
            body.workOrderNo = `WO-${Date.now().toString().slice(-6)}`;
        }

        const stitchingOrder = await StitchingOrder.create(body);
        return NextResponse.json(stitchingOrder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
