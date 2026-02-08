import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Inward from '@/backend/models/Inward';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const body = await request.json();
        const inward = await Inward.findByIdAndUpdate(params.id, body, { new: true });

        if (!inward) {
            return NextResponse.json({ error: 'Inward not found' }, { status: 404 });
        }

        return NextResponse.json(inward);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
