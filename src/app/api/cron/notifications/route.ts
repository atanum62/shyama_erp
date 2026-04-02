import { NextResponse } from 'next/server';
import { NotificationService } from '@/backend/services/NotificationService';
import dbConnect from '@/lib/db';

/**
 * GET /api/cron/notifications
 * This endpoint triggers the automated notification checks.
 * Ideally, this should be called by an external cron service daily.
 */
export async function GET(request: Request) {
    try {
        await dbConnect();

        // Optional: Add simple API key protection if needed
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        
        if (secret !== process.env.NEXTAUTH_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await NotificationService.runPeriodicChecks();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            processed: results
        });
    } catch (error: any) {
        console.error('[Cron API] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
