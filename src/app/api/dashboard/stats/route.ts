import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Inward from '@/backend/models/Inward';
import CuttingOrder from '@/backend/models/CuttingOrder';
import StitchingOrder from '@/backend/models/StitchingOrder';
import DeliveryChallan from '@/backend/models/DeliveryChallan';
import Payment from '@/backend/models/Payment';

export async function GET() {
    try {
        await dbConnect();

        const [inwardCount, cuttingCount, stitchingCount, deliveryCount, payments] = await Promise.all([
            Inward.countDocuments(),
            CuttingOrder.countDocuments(),
            StitchingOrder.countDocuments(),
            DeliveryChallan.countDocuments(),
            Payment.find()
        ]);

        // Calculate some basic metrics
        const totalReceivables = payments.filter(p => p.type === 'Receivable').reduce((acc, p) => acc + p.balanceAmount, 0);
        const totalPayables = payments.filter(p => p.type === 'Payable').reduce((acc, p) => acc + p.balanceAmount, 0);

        return NextResponse.json({
            counts: {
                inwards: inwardCount,
                cutting: cuttingCount,
                stitching: stitchingCount,
                delivery: deliveryCount
            },
            accounting: {
                receivables: totalReceivables,
                payables: totalPayables
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
