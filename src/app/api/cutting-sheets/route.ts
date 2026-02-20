import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CuttingSheet from '@/backend/models/CuttingSheet';

export async function GET() {
    try {
        await dbConnect();
        const sheets = await CuttingSheet.find()
            .populate('partyId', 'name')
            .populate('clientId', 'name')
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
            const count = await CuttingSheet.countDocuments();
            body.sheetNo = `CS-${String(count + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
        }

        // Calculate row totals
        if (body.rows && Array.isArray(body.rows)) {
            const SIZES = ['s75', 's80', 's85', 's90', 's95', 's100', 's105', 's110'];
            let grandDoz = 0, grandPcs = 0, grandFab = 0, grandWast = 0, grandRip = 0;

            body.rows = body.rows.map((row: any, i: number) => {
                const totalDozens = SIZES.reduce((sum, s) => sum + (Number(row[s]) || 0), 0);
                const totalPieces = totalDozens * 12;
                grandDoz += totalDozens;
                grandPcs += totalPieces;
                grandFab += Number(row.fabricUsedKg) || 0;
                grandWast += Number(row.wastageKg) || 0;
                grandRip += Number(row.rippedKg) || 0;
                return { ...row, srNo: i + 1, totalDozens, totalPieces };
            });

            body.grandTotalDozens = grandDoz;
            body.grandTotalPieces = grandPcs;
            body.totalFabricUsedKg = grandFab;
            body.totalWastageKg = grandWast;
            body.totalRippedKg = grandRip;
        }

        const sheet = await CuttingSheet.create(body);
        return NextResponse.json(sheet, { status: 201 });
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
