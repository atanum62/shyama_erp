import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiameterMapping from '@/backend/models/DiameterMapping';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const doc = await DiameterMapping.findById(id);
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(doc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        delete body._id;
        delete body.createdAt;
        delete body.updatedAt;

        const doc = await DiameterMapping.findByIdAndUpdate(id, body, { new: true });
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(doc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const result = await DiameterMapping.findByIdAndDelete(id);
        if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
