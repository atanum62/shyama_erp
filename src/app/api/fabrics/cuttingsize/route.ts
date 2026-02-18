import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CuttingSize from '@/backend/models/CuttingSize';

export async function GET() {
    try {
        await dbConnect();
        const cuttingSizes = await CuttingSize.find().sort({ createdAt: -1 });
        return NextResponse.json(cuttingSizes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Basic validation
        if (!body.lotNo || !body.color || !body.weight || !body.cuttingsize) {
            return NextResponse.json({ error: 'All fields (lotNo, color, weight, cuttingsize) are required' }, { status: 400 });
        }

        const cuttingSize = await CuttingSize.create(body);
        return NextResponse.json(cuttingSize, { status: 201 });
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

        const cuttingSize = await CuttingSize.findByIdAndUpdate(_id, updateData, { new: true });

        if (!cuttingSize) {
            return NextResponse.json({ error: 'Cutting size not found' }, { status: 404 });
        }

        return NextResponse.json(cuttingSize);
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

        const cuttingSize = await CuttingSize.findByIdAndDelete(id);

        if (!cuttingSize) {
            return NextResponse.json({ error: 'Cutting size not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Cutting size deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
