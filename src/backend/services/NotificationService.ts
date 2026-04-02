import Inward, { InwardType } from '../models/Inward';
import CuttingSheet from '../models/CuttingSheet';
import StitchingOrder from '../models/StitchingOrder';
import ReturnHistory from '../models/ReturnHistory';
import SystemSettings from '../models/SystemSettings';
import NotificationLog from '../models/NotificationLog';
import DeliveryChallan, { DeliveryStatus } from '../models/DeliveryChallan';
import Payment, { PaymentStatus, PaymentType } from '../models/Payment';
import Party from '../models/Party';
import Stitcher from '../models/Stitcher';
import { sendEmail } from '../../lib/mail';
import { getBaseEmailTemplate } from '../../lib/email-templates';

export class NotificationService {
    /**
     * Main execution point for the notification engine.
     * Checks all 6 logic points and sends emails accordingly.
     */
    static async runPeriodicChecks() {
        console.log('[NotificationService] Starting periodic checks...');
        const settings = await SystemSettings.findOne();
        if (!settings || !settings.emailEnabled || !settings.receiverEmail) {
            console.log('[NotificationService] Notifications disabled or settings missing.');
            return;
        }

        const results = {
            redyeAlerts: await this.checkRedyeAlerts(settings),
            fabricToCutting: await this.checkFabricToCutting(settings),
            cuttingToAccessory: await this.checkCuttingToAccessory(settings),
            stitchingDelay: await this.checkStitchingDelay(settings),
            accessoryToProduct: await this.checkAccessoryToProduct(settings),
            paymentMilestones: await this.checkPaymentMilestones(settings),
        };

        console.log('[NotificationService] Periodic checks completed.', results);
        return results;
    }

    private static async alreadySent(type: string, relatedId: any): Promise<boolean> {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await NotificationLog.findOne({
            type,
            relatedId,
            sentAt: { $gte: twentyFourHoursAgo }
        });
        return !!existing;
    }

    private static async logNotification(type: any, recipient: string, relatedId: any, status: 'Sent' | 'Failed', errorMessage?: string) {
        await NotificationLog.create({
            type,
            recipient,
            relatedId,
            status,
            errorMessage,
            sentAt: new Date()
        });
    }

    // 1. Redye Alert (15 days)
    private static async checkRedyeAlerts(settings: any) {
        const threshold = settings.redyeThreshold || 15;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

        const pendingRedye = await ReturnHistory.find({
            'history.action': 'Returned',
            rereceiveDate: { $exists: false },
            returnDate: { $lte: cutoffDate }
        }).populate('partyId');

        let count = 0;
        for (const record of pendingRedye) {
            if (await this.alreadySent('REDYE_ALERT', record._id)) continue;

            const recipient = settings.receiverEmail;
            
            const html = getBaseEmailTemplate({
                title: 'Redye Completion Alert',
                message: `A product returned for redye has exceeded the ${threshold}-day completion window.`,
                details: [
                    { label: 'Lot No', value: record.lotNo },
                    { label: 'Return Date', value: record.returnDate?.toLocaleDateString() },
                    { label: 'Item ID', value: record.itemId },
                    { label: 'Original Quantity', value: `${record.originalQuantity} pcs` }
                ]
            });

            const res = await sendEmail({ to: recipient, subject: `ALERT: Redye Pending - Lot ${record.lotNo}`, html });
            await this.logNotification('REDYE_ALERT', recipient, record._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
            if (res.success) count++;
        }
        return count;
    }

    // 2. Fabric Inward to Cutting (10 days)
    private static async checkFabricToCutting(settings: any) {
        const threshold = settings.fabricToCuttingThreshold || 10;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

        const pendingInwards = await Inward.find({
            type: InwardType.FABRIC,
            inwardDate: { $lte: cutoffDate }
        });

        let count = 0;
        for (const inward of pendingInwards) {
            // Check if any cutting sheet exists for this inward/lot
            const hasCutting = await CuttingSheet.findOne({ 
                $or: [{ lotNo: inward.lotNo }, { challanNo: inward.challanNo }] 
            });

            if (!hasCutting) {
                if (await this.alreadySent('FABRIC_CUTTING_ALERT', inward._id)) continue;

                const recipient = settings.receiverEmail;
                const html = getBaseEmailTemplate({
                    title: 'Fabric Cutting Alert',
                    message: `Fabric inwarded over ${threshold} days ago has not yet been processed for cutting.`,
                    details: [
                        { label: 'Lot No', value: inward.lotNo || 'N/A' },
                        { label: 'Inward Date', value: inward.inwardDate.toLocaleDateString() },
                        { label: 'Challan No', value: inward.challanNo || 'N/A' },
                        { label: 'Total Quantity', value: `${inward.totalQuantity} items` }
                    ]
                });

                const res = await sendEmail({ to: recipient, subject: `ALERT: Cutting Pending - Lot ${inward.lotNo}`, html });
                await this.logNotification('FABRIC_CUTTING_ALERT', recipient, inward._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
                if (res.success) count++;
            }
        }
        return count;
    }

    // 3. Cutting Sheet to Accessories (5 days)
    private static async checkCuttingToAccessory(settings: any) {
        const threshold = settings.cuttingToAccessoryThreshold || 5;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

        const submittedSheets = await CuttingSheet.find({
            status: 'Submitted',
            date: { $lte: cutoffDate }
        });

        let count = 0;
        for (const sheet of submittedSheets) {
            const hasAccessories = await Inward.findOne({
                type: InwardType.ACCESSORY,
                lotNo: sheet.lotNo
            });

            if (!hasAccessories) {
                if (await this.alreadySent('ACCESSORY_DELIVERY_ALERT', sheet._id)) continue;

                const recipient = settings.receiverEmail; // Ideally the accessory vendor email if available
                const html = getBaseEmailTemplate({
                    title: 'Accessory Delivery Delay',
                    message: `Cutting sheet submitted over ${threshold} days ago is still waiting for associated accessories.`,
                    details: [
                        { label: 'Sheet No', value: sheet.sheetNo },
                        { label: 'Lot No', value: sheet.lotNo || 'N/A' },
                        { label: 'Submission Date', value: sheet.date.toLocaleDateString() },
                        { label: 'Product', value: sheet.productName }
                    ]
                });

                const res = await sendEmail({ to: recipient, subject: `ALERT: Accessories Missing - Sheet ${sheet.sheetNo}`, html });
                await this.logNotification('ACCESSORY_DELIVERY_ALERT', recipient, sheet._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
                if (res.success) count++;
            }
        }
        return count;
    }

    // 4. Stitching Delay (15 days)
    private static async checkStitchingDelay(settings: any) {
        const threshold = settings.stitchingDelayThreshold || 15;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

        const pendingOrders = await StitchingOrder.find({
            status: { $ne: 'Completed' },
            createdAt: { $lte: cutoffDate }
        }).populate('stitcherId');

        let count = 0;
        for (const order of pendingOrders) {
            if (await this.alreadySent('STITCHING_DELAY_ALERT', order._id)) continue;

            const recipient = settings.receiverEmail;

            const html = getBaseEmailTemplate({
                title: 'Stitching Progress Alert',
                message: `Work order for stitching has not been completed within the ${threshold}-day production window.`,
                details: [
                    { label: 'Order No', value: order.workOrderNo },
                    { label: 'Order Date', value: order.createdAt.toLocaleDateString() },
                    { label: 'Stitcher', value: (order.stitcherId as any)?.name || 'N/A' },
                    { label: 'Status', value: order.status }
                ]
            });

            const res = await sendEmail({ to: recipient, subject: `ALERT: Stitching Delayed - Order ${order.workOrderNo}`, html });
            await this.logNotification('STITCHING_DELAY_ALERT', recipient, order._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
            if (res.success) count++;
        }
        return count;
    }

    // 5. Accessory to Product Apology (20 days)
    private static async checkAccessoryToProduct(settings: any) {
        const threshold = settings.accessoryToProductThreshold || 20;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

        const accessoryInwards = await Inward.find({
            type: InwardType.ACCESSORY,
            inwardDate: { $lte: cutoffDate }
        }).populate('partyId');

        let count = 0;
        for (const inward of accessoryInwards) {
            const hasDispatch = await DeliveryChallan.findOne({
                status: { $in: [DeliveryStatus.DISPATCHED, DeliveryStatus.DELIVERED] },
                'items.lotNo': inward.lotNo
            });

            if (!hasDispatch) {
                if (await this.alreadySent('PRODUCT_READY_APOLOGY', inward._id)) continue;

                const recipient = settings.receiverEmail;

                const html = getBaseEmailTemplate({
                    title: 'Production Delay Apology',
                    message: `We sincerely apologize for the delay in processing your order. Accessories received on ${inward.inwardDate.toLocaleDateString()} are still in production.`,
                    details: [
                        { label: 'Lot No', value: inward.lotNo || 'N/A' },
                        { label: 'Accessory Inward', value: inward.inwardDate.toLocaleDateString() },
                        { label: 'Current Status', value: 'In Final Production' }
                    ],
                    isApology: true
                });

                const res = await sendEmail({ to: recipient, subject: `APOLOGY: Delayed Ready Product - Lot ${inward.lotNo}`, html });
                await this.logNotification('PRODUCT_READY_APOLOGY', recipient, inward._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
                if (res.success) count++;
            }
        }
        return count;
    }

    // 6. Payment Milestone logic (15 days)
    private static async checkPaymentMilestones(settings: any) {
        const threshold = settings.paymentThreshold || 15;
        const cutoffDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);
        let count = 0;

        // 6a. Stitcher Apology (Complete -> Payment)
        const completedOrders = await StitchingOrder.find({
            status: 'Completed',
            updatedAt: { $lte: cutoffDate }
        }).populate('stitcherId');

        for (const order of completedOrders) {
            const hasPayment = await Payment.findOne({
                referenceId: order.workOrderNo,
                status: PaymentStatus.COMPLETED
            });

            if (!hasPayment) {
                if (await this.alreadySent('PAYMENT_APOLOGY', order._id)) continue;
                const recipient = settings.receiverEmail;

                const html = getBaseEmailTemplate({
                    title: 'Payment Delay Apology',
                    message: `We apologize for the delay in processing your payment for order ${order.workOrderNo}. Our finance team is working on it.`,
                    details: [
                        { label: 'Order No', value: order.workOrderNo },
                        { label: 'Completion Date', value: order.updatedAt.toLocaleDateString() },
                        { label: 'Stitcher', value: (order.stitcherId as any)?.name || 'N/A' },
                        { label: 'Pending Payment', value: 'In Process' }
                    ],
                    isApology: true
                });

                const res = await sendEmail({ to: recipient, subject: `APOLOGY: Payment Delay - Order ${order.workOrderNo}`, html });
                await this.logNotification('PAYMENT_APOLOGY', recipient, order._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
                if (res.success) count++;
            }
        }

        // 6b. Company Payment Alert (Delivered -> Payment)
        const deliveredChallans = await DeliveryChallan.find({
            status: DeliveryStatus.DELIVERED,
            deliveryDate: { $lte: cutoffDate }
        }).populate('clientId');

        for (const challan of deliveredChallans) {
            const hasPayment = await Payment.findOne({
                referenceId: challan.challanNo,
                status: PaymentStatus.COMPLETED
            });

            if (!hasPayment) {
                if (await this.alreadySent('PAYMENT_ALERT', challan._id)) continue;
                const recipient = settings.receiverEmail;

                const html = getBaseEmailTemplate({
                    title: 'Outstanding Payment Alert',
                    message: `This is a friendly reminder that the payment for delivery challan ${challan.challanNo} is now due as per our ${threshold}-day cycle.`,
                    details: [
                        { label: 'Challan No', value: challan.challanNo },
                        { label: 'Delivery Date', value: challan.deliveryDate.toLocaleDateString() },
                        { label: 'Client', value: (challan.clientId as any)?.name || 'N/A' },
                        { label: 'Status', value: 'Awaiting Payment' }
                    ]
                });

                const res = await sendEmail({ to: recipient, subject: `ALERT: Outstanding Payment - Challan ${challan.challanNo}`, html });
                await this.logNotification('PAYMENT_ALERT', recipient, challan._id, res.success ? 'Sent' : 'Failed', (res.error as any)?.message);
                if (res.success) count++;
            }
        }

        return count;
    }
}
