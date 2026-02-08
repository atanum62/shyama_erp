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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const party = await Party.create(body);
        return NextResponse.json(party, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
