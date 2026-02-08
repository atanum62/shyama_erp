import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CuttingOrder from '@/backend/models/CuttingOrder';
import Inward from '@/backend/models/Inward';

export async function GET() {
    try {
        await dbConnect();
        const cuttingOrders = await CuttingOrder.find()
            .populate('inwardId')
            .populate('fabricId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(cuttingOrders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Ensure order number
        if (!body.orderNo) {
            body.orderNo = `CT-${Date.now().toString().slice(-6)}`;
        }

        const cuttingOrder = await CuttingOrder.create(body);
        return NextResponse.json(cuttingOrder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
