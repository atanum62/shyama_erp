import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StitchingOrder from '@/backend/models/StitchingOrder';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // If we are recording a receipt, we might want to increment existing counts
        const order = await StitchingOrder.findById(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        if (body.addReceived) {
            order.receivedQuantity += body.addReceived;
            delete body.addReceived;
        }
        if (body.addRejected) {
            order.rejectedQuantity += body.addRejected;
            delete body.addRejected;
        }

        // Apply other updates (status, rework, etc.)
        Object.assign(order, body);
        await order.save();

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
