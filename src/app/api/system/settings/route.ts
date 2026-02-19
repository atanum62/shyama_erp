import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSettings from '@/backend/models/SystemSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        // Always get the latest updated settings
        let settings = await SystemSettings.findOne().sort({ updatedAt: -1 });

        if (!settings) {
            // Create default settings if none exist
            settings = await SystemSettings.create({
                companyName: 'SHYAMA INDUSTRIES',
                erpName: 'SHYAMA ERP'
            });
        }
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        let settings = await SystemSettings.findOne().sort({ updatedAt: -1 });
        if (settings) {
            settings = await SystemSettings.findByIdAndUpdate(settings._id, body, { new: true });
        } else {
            settings = await SystemSettings.create(body);
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
