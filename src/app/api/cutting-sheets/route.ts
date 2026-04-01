import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CuttingSheet from '@/backend/models/CuttingSheet';

export async function GET() {
    try {
        await dbConnect();
        const sheets = await CuttingSheet.find()
            .sort({ createdAt: -1 });
        return NextResponse.json(sheets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Auto-generate sheet number if not provided
        if (!body.sheetNo) {
            const lastSheet = await CuttingSheet.findOne({}, { sheetNo: 1 }).sort({ createdAt: -1 });
            let nextNum = 1;

            if (lastSheet && lastSheet.sheetNo) {
                const parts = lastSheet.sheetNo.split('-');
                if (parts.length >= 2) {
                    const lastNum = parseInt(parts[1], 10);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
            }

            body.sheetNo = `CS-${String(nextNum).padStart(4, '0')}-${new Date().getFullYear()}`;
            
            // Final safety check: if this auto-generated number already exists (due to manual edits), keep incrementing
            let duplicate = await CuttingSheet.findOne({ sheetNo: body.sheetNo });
            while (duplicate) {
                nextNum++;
                body.sheetNo = `CS-${String(nextNum).padStart(4, '0')}-${new Date().getFullYear()}`;
                duplicate = await CuttingSheet.findOne({ sheetNo: body.sheetNo });
            }
        }

        // Calculate row totals
        if (body.rows && Array.isArray(body.rows)) {
            let grandDoz = 0, grandPcs = 0, grandWeight = 0, grandWast = 0;

            body.rows.forEach((row: any) => {
                grandDoz += Number(row.doz) || 0;
                grandPcs += Number(row.pcs) || 0;
                grandWeight += Number(row.totalRowWeight) || 0;
                grandWast += Number(row.wastage) || 0;
            });

            body.grandTotalDozens = grandDoz;
            body.grandTotalPieces = grandPcs;
            body.totalFabricUsedKg = grandWeight;
            body.totalWastageKg = grandWast;
        }

        const sheet = await CuttingSheet.create(body);
        return NextResponse.json(sheet, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const body = await request.json();

        // Calculate row totals
        if (body.rows && Array.isArray(body.rows)) {
            let grandDoz = 0, grandPcs = 0, grandWeight = 0, grandWast = 0;

            body.rows.forEach((row: any) => {
                grandDoz += Number(row.doz) || 0;
                grandPcs += Number(row.pcs) || 0;
                grandWeight += Number(row.totalRowWeight) || 0;
                grandWast += Number(row.wastage) || 0;
            });

            body.grandTotalDozens = grandDoz;
            body.grandTotalPieces = grandPcs;
            body.totalFabricUsedKg = grandWeight;
            body.totalWastageKg = grandWast;
        }

        const updated = await CuttingSheet.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await CuttingSheet.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
