import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/backend/models/Product';

export async function GET() {
    try {
        await dbConnect();
        const data = await Product.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        // Auto calculate price per piece in case middleware doesn't trigger on some mongoose versions/methods
        const pricePerDozen = Number(body.pricePerDozen) || 0;
        const pricePerPiece = Number((pricePerDozen / 12).toFixed(2));

        const doc = await Product.create({
            ...body,
            pricePerPiece,
            image: body.image || ''
        });
        return NextResponse.json(doc, { status: 201 });
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
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const pricePerDozen = Number(updateData.pricePerDozen) || 0;
        updateData.pricePerPiece = Number((pricePerDozen / 12).toFixed(2));

        const doc = await Product.findByIdAndUpdate(_id, {
            ...updateData,
            image: updateData.image
        }, { new: true });
        return NextResponse.json(doc);
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
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        await Product.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
