import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
    try {
        await dbConnect();

        // Check connection state
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const state = mongoose.connection.readyState;

        const states = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting',
        };

        if (state === 1) {
            return NextResponse.json({
                success: true,
                status: 'Connected',
                message: 'Database is functioning normally',
                database: mongoose.connection.name,
            });
        } else {
            return NextResponse.json({
                success: false,
                status: states[state as keyof typeof states] || 'Unknown',
                message: 'Database is not fully connected',
            }, { status: 503 });
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            status: 'Error',
            message: error.message,
        }, { status: 500 });
    }
}
