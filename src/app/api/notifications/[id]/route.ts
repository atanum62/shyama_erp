import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotificationLog from '@/backend/models/NotificationLog';
import ReturnHistory from '@/backend/models/ReturnHistory';
import Inward from '@/backend/models/Inward';
import CuttingSheet from '@/backend/models/CuttingSheet';
import StitchingOrder from '@/backend/models/StitchingOrder';
import DeliveryChallan from '@/backend/models/DeliveryChallan';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        
        const { id } = await params;
        const log = await NotificationLog.findById(id);
        
        if (!log) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        let title = 'System Alert';
        let message = '';
        let type = 'info';
        let category = 'System';
        let longDescription = '';
        let sender = 'System';
        let dynamicDetails: any = null;

        // Fetch related document based on type
        switch (log.type) {
            case 'REDYE_ALERT':
                title = 'Redye Overdue';
                category = 'Redye';
                type = 'warning';
                sender = 'Quality Control';
                message = 'A product returned for redye has missed its completion window.';
                const redyeDoc = await ReturnHistory.findById(log.relatedId).populate('partyId');
                if (redyeDoc) {
                    dynamicDetails = {
                        'Lot No': redyeDoc.lotNo,
                        'Return Date': redyeDoc.returnDate?.toLocaleDateString(),
                        'Item ID': redyeDoc.itemId,
                        'Quantity': `${redyeDoc.originalQuantity} pcs`,
                        'Party Name': (redyeDoc.partyId as any)?.name || 'N/A'
                    };
                    longDescription = `The redye process for Lot ${redyeDoc.lotNo} sent to vendor ${(redyeDoc.partyId as any)?.name} on ${redyeDoc.returnDate?.toLocaleDateString()} has exceeded the expected completion time. Please follow up with the vendor.`;
                }
                break;

            case 'FABRIC_CUTTING_ALERT':
                title = 'Fabric Cutting Pending';
                category = 'Production';
                type = 'warning';
                sender = 'Inventory Management';
                message = 'Fabric inward is significantly overdue for cutting.';
                const inwardDoc = await Inward.findById(log.relatedId).populate('partyId');
                if (inwardDoc) {
                    dynamicDetails = {
                        'Lot No': inwardDoc.lotNo || 'N/A',
                        'Inward Date': inwardDoc.inwardDate.toLocaleDateString(),
                        'Challan No': inwardDoc.challanNo || 'N/A',
                        'Total Quantity': `${inwardDoc.totalQuantity} items`,
                        'Vendor Name': (inwardDoc.partyId as any)?.name || 'N/A'
                    };
                    longDescription = `Fabric (Lot No: ${inwardDoc.lotNo}) received on ${inwardDoc.inwardDate.toLocaleDateString()} from ${(inwardDoc.partyId as any)?.name} has not yet been processed for cutting. Action is required to maintain production flow.`;
                }
                break;

            case 'ACCESSORY_DELIVERY_ALERT':
                title = 'Accessories Delayed';
                category = 'Procurement';
                type = 'warning';
                sender = 'Procurement Department';
                message = 'A cutting sheet is stuck waiting for its accessories.';
                const cuttingDoc = await CuttingSheet.findById(log.relatedId);
                if (cuttingDoc) {
                    dynamicDetails = {
                        'Sheet No': cuttingDoc.sheetNo,
                        'Lot No': cuttingDoc.lotNo || 'N/A',
                        'Submission Date': cuttingDoc.date.toLocaleDateString(),
                        'Product Name': cuttingDoc.productName
                    };
                    longDescription = `Cutting Sheet ${cuttingDoc.sheetNo} (Lot No: ${cuttingDoc.lotNo}) submitted on ${cuttingDoc.date.toLocaleDateString()} is pending due to missing accessory deliveries. Please coordinate with the procurement manager.`;
                }
                break;

            case 'STITCHING_DELAY_ALERT':
                title = 'Stitching Delayed';
                category = 'Stitching';
                type = 'error';
                sender = 'Production Supervisor';
                message = 'This stitching order has missed its expected deadline.';
                const stitchDoc = await StitchingOrder.findById(log.relatedId).populate('stitcherId');
                if (stitchDoc) {
                    dynamicDetails = {
                        'Order No': stitchDoc.workOrderNo,
                        'Order Date': stitchDoc.createdAt.toLocaleDateString(),
                        'Stitcher Name': (stitchDoc.stitcherId as any)?.name || 'N/A',
                        'Current Status': stitchDoc.status
                    };
                    longDescription = `Stitching order ${stitchDoc.workOrderNo} assigned to ${(stitchDoc.stitcherId as any)?.name} on ${stitchDoc.createdAt.toLocaleDateString()} is severely delayed. The work window has expired. Please investigate immediately.`;
                }
                break;

            case 'PRODUCT_READY_APOLOGY':
                title = 'Production Delayed';
                category = 'Production';
                type = 'error';
                sender = 'Dispatch Department';
                message = 'Final product is still stuck in production line since accessories arrived.';
                const accInward = await Inward.findById(log.relatedId).populate('partyId');
                if (accInward) {
                    dynamicDetails = {
                        'Lot No': accInward.lotNo || 'N/A',
                        'Accessory Inward Date': accInward.inwardDate.toLocaleDateString(),
                        'Current Status': 'In Final Production'
                    };
                    longDescription = `Products associated with Accessory Lot ${accInward.lotNo} (received ${accInward.inwardDate.toLocaleDateString()}) are still not marked for dispatch. This indicates a bottleneck at the final finishing stage.`;
                }
                break;

            case 'PAYMENT_APOLOGY':
                title = 'Stitcher Payment Delayed';
                category = 'Finance';
                type = 'error';
                sender = 'Finance Department';
                message = 'Payment for this completed stitching order is overdue.';
                const payStitchDoc = await StitchingOrder.findById(log.relatedId).populate('stitcherId');
                if (payStitchDoc) {
                    dynamicDetails = {
                        'Order No': payStitchDoc.workOrderNo,
                        'Completion Date': payStitchDoc.updatedAt.toLocaleDateString(),
                        'Stitcher details': (payStitchDoc.stitcherId as any)?.name || 'N/A',
                        'Pending Payment': 'In Process'
                    };
                    longDescription = `Automated notification: Payment for completed order ${payStitchDoc.workOrderNo} (Stitcher: ${(payStitchDoc.stitcherId as any)?.name}) has exceeded the expected payment timeframe and remains unpaid.`;
                }
                break;

            case 'PAYMENT_ALERT':
                title = 'Client Payment Due';
                category = 'Finance';
                type = 'warning';
                sender = 'Accounts Receivable';
                message = 'Payment for this delivery challan is still outstanding from the client.';
                const challanDoc = await DeliveryChallan.findById(log.relatedId).populate('clientId');
                if (challanDoc) {
                    dynamicDetails = {
                        'Challan No': challanDoc.challanNo,
                        'Delivery Date': challanDoc.deliveryDate.toLocaleDateString(),
                        'Client Name': (challanDoc.clientId as any)?.name || 'N/A',
                        'Status': 'Awaiting Payment'
                    };
                    longDescription = `Client ${(challanDoc.clientId as any)?.name} has an outstanding payment for delivery challan ${challanDoc.challanNo} dated ${challanDoc.deliveryDate.toLocaleDateString()}. Please issue a follow-up.`;
                }
                break;
        }

        if (log.status === 'Failed') {
            type = 'error';
            title = `${title} (Failed to send Email)`;
        }

        // Also mark as read when viewed dynamically
        if (!log.read) {
            await NotificationLog.findByIdAndUpdate(id, { read: true });
        }

        const data = {
            id: log._id.toString(),
            title,
            message,
            longDescription,
            time: log.sentAt.toISOString(), 
            date: log.sentAt.toISOString(),
            type,
            category,
            sender,
            dynamicDetails
        };

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
