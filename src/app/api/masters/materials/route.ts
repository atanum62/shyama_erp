import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Material from '@/backend/models/Material';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const query = category ? { category } : {};
        const materials = await Material.find(query).sort({ name: 1 });

        return NextResponse.json(materials);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const material = await Material.create(body);
        return NextResponse.json(material, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
