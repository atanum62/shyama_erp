import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotificationLog extends Document {
    type: 'REDYE_ALERT' | 'FABRIC_CUTTING_ALERT' | 'ACCESSORY_DELIVERY_ALERT' | 'STITCHING_DELAY_ALERT' | 'PRODUCT_READY_APOLOGY' | 'PAYMENT_ALERT' | 'PAYMENT_APOLOGY';
    recipient: string;
    relatedId: Types.ObjectId | string; // ID of Inward, CuttingSheet, etc.
    status: 'Sent' | 'Failed';
    errorMessage?: string;
    read: boolean;
    sentAt: Date;
}

const NotificationLogSchema: Schema = new Schema(
    {
        type: { 
            type: String, 
            required: true,
            enum: [
                'REDYE_ALERT', 
                'FABRIC_CUTTING_ALERT', 
                'ACCESSORY_DELIVERY_ALERT', 
                'STITCHING_DELAY_ALERT', 
                'PRODUCT_READY_APOLOGY', 
                'PAYMENT_ALERT', 
                'PAYMENT_APOLOGY'
            ]
        },
        recipient: { type: String, required: true },
        relatedId: { type: Schema.Types.Mixed, required: true },
        status: { type: String, enum: ['Sent', 'Failed'], default: 'Sent' },
        errorMessage: { type: String },
        read: { type: Boolean, default: false },
        sentAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Index to quickly check if a notification was already sent for a specific record today
NotificationLogSchema.index({ type: 1, relatedId: 1, sentAt: -1 });

const NotificationLog = mongoose.models.NotificationLog || mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
export default NotificationLog;
