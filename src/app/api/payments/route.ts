import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/backend/models/Payment';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const query = type ? { type } : {};
        const payments = await Payment.find(query)
            .populate('partyId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(payments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const payment = await Payment.create(body);
        return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
