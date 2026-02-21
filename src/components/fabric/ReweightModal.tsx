'use client';

import React, { useState } from 'react';
import { Scale, X } from 'lucide-react';

interface ReweightModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onUpdate: (id: string, itemId: string, newWeight: number) => Promise<void>;
}

export const ReweightModal: React.FC<ReweightModalProps> = ({ isOpen, onClose, item, onUpdate }) => {
    const [newWeight, setNewWeight] = useState<string>(item?.quantity?.toString() || '');
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen || !item) return null;

    const handleConfirm = async () => {
        if (!newWeight || isNaN(Number(newWeight))) return;
        setIsUpdating(true);
        try {
            await onUpdate(item.inwardId || item.id, item._id || item.itemId, Number(newWeight));
            onClose();
        } catch (err) {
            console.error('Reweight failed:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Scale className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">Update Fabric Weight</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-secondary/30 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Challan No:</span>
                            <span className="font-bold">{item.challanNo || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Fabric:</span>
                            <span className="font-bold">{item.materialId?.name || 'Standard Fabric'} ({item.color})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Current Weight:</span>
                            <span className="font-bold text-red-500">{item.quantity} KG</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground ml-1">Corrected Weight (KG)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                autoFocus
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                placeholder="Enter actual weight..."
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-bold"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">KG</div>
                        </div>
                        <p className="text-[10px] text-muted ml-1 italic">* This will update the inward quantity and reset status to Pending for inspection.</p>
                    </div>
                </div>

                <div className="p-6 bg-secondary/10 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-border bg-card hover:bg-secondary text-foreground font-bold rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isUpdating || !newWeight}
                        className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUpdating ? 'Updating...' : 'Confirm Reweight'}
                    </button>
                </div>
            </div>
        </div>
    );
};
