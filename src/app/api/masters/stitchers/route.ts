import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Stitcher from '@/backend/models/Stitcher';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const stitchers = await Stitcher.find({}).sort({ name: 1 });
        return NextResponse.json(stitchers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const stitcher = await Stitcher.create(body);
        return NextResponse.json(stitcher, { status: 201 });
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

        const stitcher = await Stitcher.findByIdAndUpdate(_id, updateData, { new: true });

        if (!stitcher) {
            return NextResponse.json({ error: 'Stitcher not found' }, { status: 404 });
        }

        return NextResponse.json(stitcher);
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

        const stitcher = await Stitcher.findByIdAndDelete(id);

        if (!stitcher) {
            return NextResponse.json({ error: 'Stitcher not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Stitcher deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
