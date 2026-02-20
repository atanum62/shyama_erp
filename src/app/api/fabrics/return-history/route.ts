import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ReturnHistory from '@/backend/models/ReturnHistory';

export async function GET() {
    try {
        await dbConnect();
        const history = await ReturnHistory.find({})
            .populate('partyId', 'name')
            .populate('materialId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const deleted = await ReturnHistory.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'History record deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
