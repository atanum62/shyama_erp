import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CuttingLotAssignment from '@/backend/models/CuttingLotAssignment';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const lotNo = searchParams.get('lotNo');

        const query = lotNo ? { lotNo } : {};
        const assignments = await CuttingLotAssignment.find(query)
            .populate('materialId', 'name')
            .sort({ date: -1 });

        return NextResponse.json(assignments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Calculate total pieces if not provided
        if (body.totalDozen && !body.totalPieces) {
            body.totalPieces = body.totalDozen * 12;
        }

        const assignment = await CuttingLotAssignment.create(body);
        return NextResponse.json(assignment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const lotNo = searchParams.get('lotNo');

        if (lotNo) {
            // Bulk revert: delete every assignment that belongs to this lot
            const result = await CuttingLotAssignment.deleteMany({ lotNo });
            return NextResponse.json({ message: `Reverted ${result.deletedCount} assignment(s) for lot ${lotNo}` });
        }

        if (!id) {
            return NextResponse.json({ error: 'ID or lotNo is required' }, { status: 400 });
        }

        const deleted = await CuttingLotAssignment.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
