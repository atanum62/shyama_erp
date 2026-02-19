import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Color from '@/backend/models/Color';

export async function GET() {
    try {
        await dbConnect();
        const colors = await Color.find().sort({ name: 1 });
        return NextResponse.json(colors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Auto-generate code if not provided
        if (!body.code) {
            body.code = 'CLR-' + body.name.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
        }

        const color = await Color.create(body);
        return NextResponse.json(color, { status: 201 });
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

        const color = await Color.findByIdAndUpdate(_id, updateData, { new: true });

        if (!color) {
            return NextResponse.json({ error: 'Color not found' }, { status: 404 });
        }

        return NextResponse.json(color);
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

        const color = await Color.findByIdAndDelete(id);

        if (!color) {
            return NextResponse.json({ error: 'Color not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Color deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
