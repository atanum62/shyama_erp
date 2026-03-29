import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BOM from '@/backend/models/BOM';

export async function PUT(request: Request, context: any) {
    try {
        await dbConnect();
        const { id } = await context.params;
        const body = await request.json();
        const bom = await BOM.findByIdAndUpdate(id, body, { new: true });
        if (!bom) return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
        return NextResponse.json(bom);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        await dbConnect();
        const { id } = await context.params;
        const bom = await BOM.findByIdAndDelete(id);
        if (!bom) return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
