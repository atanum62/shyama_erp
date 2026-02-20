import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import RibQuantity from '@/backend/models/RibQuantity';

export async function GET() {
    try {
        await dbConnect();
        const data = await RibQuantity.find().sort({ cuttingSize: 1 });
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const ribQuantity = await RibQuantity.create(body);
        return NextResponse.json(ribQuantity, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
        }

        const ribQuantity = await RibQuantity.findByIdAndUpdate(_id, updateData, { new: true });

        if (!ribQuantity) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json(ribQuantity);
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
            return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
        }

        const ribQuantity = await RibQuantity.findByIdAndDelete(id);

        if (!ribQuantity) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
