import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotificationLog from '@/backend/models/NotificationLog';

export async function GET(request: Request) {
    try {
        await dbConnect();
        
        // Fetch last 50 notifications
        const logs = await NotificationLog.find().sort({ sentAt: -1 }).limit(50);
        
        const mappedLogs = logs.map(log => {
            let title = 'System Alert';
            let message = '';
            let type = 'info';
            let category = 'System';
            
            switch (log.type) {
                case 'REDYE_ALERT':
                    title = 'Redye Overdue';
                    message = 'A product returned for redye has missed its completion window.';
                    type = 'warning';
                    category = 'Redye';
                    break;
                case 'FABRIC_CUTTING_ALERT':
                    title = 'Fabric Cutting Pending';
                    message = 'Fabric inward is significantly overdue for cutting.';
                    type = 'warning';
                    category = 'Production';
                    break;
                case 'ACCESSORY_DELIVERY_ALERT':
                    title = 'Accessories Delayed';
                    message = 'A cutting sheet is stuck waiting for its accessories.';
                    type = 'warning';
                    category = 'Procurement';
                    break;
                case 'STITCHING_DELAY_ALERT':
                    title = 'Stitching Delayed';
                    message = 'This stitching order has missed its expected deadline.';
                    type = 'error';
                    category = 'Stitching';
                    break;
                case 'PRODUCT_READY_APOLOGY':
                    title = 'Production Delayed';
                    message = 'Final product is still stuck in production line since accessories arrived.';
                    type = 'error';
                    category = 'Production';
                    break;
                case 'PAYMENT_APOLOGY':
                    title = 'Stitcher Payment Delayed';
                    message = 'Payment for this completed stitching order is overdue.';
                    type = 'error';
                    category = 'Finance';
                    break;
                case 'PAYMENT_ALERT':
                    title = 'Client Payment Due';
                    message = 'Payment for this delivery challan is still outstanding from the client.';
                    type = 'warning';
                    category = 'Finance';
                    break;
            }

            if (log.status === 'Failed') {
                type = 'error';
                title = `${title} (Failed to send Email)`;
            }

            return {
                id: log._id.toString(),
                title,
                message,
                time: log.sentAt.toISOString(), 
                date: log.sentAt.toISOString(),
                type,
                unread: !log.read,
                category
            };
        });

        return NextResponse.json({ success: true, data: mappedLogs }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        
        if (body.action === 'markAllRead') {
            await NotificationLog.updateMany({ read: false }, { read: true });
        } else if (body.id) {
            await NotificationLog.findByIdAndUpdate(body.id, { read: true });
        }
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
