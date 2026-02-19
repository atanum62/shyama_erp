import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Consumption from '@/backend/models/Consumption';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const consumption = await Consumption.findById(id);
        if (!consumption) {
            return NextResponse.json({ error: 'Consumption not found' }, { status: 404 });
        }
        return NextResponse.json(consumption);
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

        // Remove immutable/system fields if present
        delete body._id;
        delete body.createdAt;
        delete body.updatedAt;

        const consumption = await Consumption.findByIdAndUpdate(id, body, { new: true });

        if (!consumption) {
            return NextResponse.json({ error: 'Consumption not found' }, { status: 404 });
        }

        return NextResponse.json(consumption);
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
        const result = await Consumption.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json({ error: 'Consumption not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
