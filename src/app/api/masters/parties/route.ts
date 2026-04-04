import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Party from '@/backend/models/Party';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const query = type ? { type } : {};
        const parties = await Party.find(query).sort({ name: 1 });

        return NextResponse.json(parties);
    } catch (error: any) {
        console.error('Parties GET Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown database error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const party = await Party.create(body);
        return NextResponse.json(party, { status: 201 });
    } catch (error: any) {
        console.error('Parties GET Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown database error' }, { status: 500 });
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

        const party = await Party.findByIdAndUpdate(_id, updateData, { new: true });

        if (!party) {
            return NextResponse.json({ error: 'Party not found' }, { status: 404 });
        }

        return NextResponse.json(party);
    } catch (error: any) {
        console.error('Parties GET Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown database error' }, { status: 500 });
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

        const party = await Party.findByIdAndDelete(id);

        if (!party) {
            return NextResponse.json({ error: 'Party not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Party deleted successfully' });
    } catch (error: any) {
        console.error('Parties GET Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown database error' }, { status: 500 });
    }
}
