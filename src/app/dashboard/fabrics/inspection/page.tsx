'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    Edit,
    X,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

export default function FabricInspectionPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Rejection Modal State
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [selectedInwardId, setSelectedInwardId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inward');
            const data = await res.json();
            setInwards(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Received': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'Inspection': return <Search className="w-4 h-4 text-blue-500" />;
            case 'Approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const handleUpdateStatus = async (id: string, itemId: string, status: string, rejectionCause?: string) => {
        try {
            const res = await fetch(`/api/inward/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionCause, itemId })
            });
            if (res.ok) {
                fetchData();
                setIsRejectionModalOpen(false);
                setSelectedInwardId(null);
                setSelectedItemId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openRejectionModal = (id: string, itemId: string) => {
        setSelectedInwardId(id);
        setSelectedItemId(itemId);
        setIsRejectionModalOpen(true);
    };

    const filteredInwards = inwards.filter(inward => {
        const query = searchTerm.toLowerCase();
        return (
            inward.lotNo?.toLowerCase().includes(query) ||
            inward.challanNo?.toLowerCase().includes(query) ||
            inward.partyId?.name?.toLowerCase().includes(query) ||
            inward.items.some((item: any) =>
                item.color?.toLowerCase().includes(query) ||
                item.materialId?.name?.toLowerCase().includes(query)
            )
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Fabric Inspection Overview</h1>
                    <p className="text-muted text-sm">Review quality control and approve/reject received fabric batches.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search challan or party..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Lot & Inward</th>
                                <th className="px-6 py-4">Dyeing House</th>
                                <th className="px-6 py-4">Consignment</th>
                                <th className="px-6 py-4">Items Inspection</th>
                                <th className="px-6 py-4 text-right">Batch Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : filteredInwards.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center">
                                    <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No entries found matching your search.</p>
                                </td></tr>
                            ) : filteredInwards.map((inward, idx) => (
                                <tr key={inward._id} className="hover:bg-secondary/5 transition-colors group align-top">
                                    <td className="px-6 py-6 max-w-[200px]">
                                        <div className="font-bold text-foreground text-sm">Lot: {inward.lotNo || '-'}</div>
                                        <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit mt-1">{new Date(inward.inwardDate).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-muted font-bold mt-2 uppercase tracking-tighter">Challan: {inward.challanNo}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-bold text-foreground">{inward.partyId?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-muted font-medium mt-1 uppercase">Supplier Receipt</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="text-sm font-black text-primary">
                                            {inward.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} KG
                                        </div>
                                        <div className="text-[10px] text-muted font-bold mt-0.5">{inward.items.length} Varieties</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-3">
                                            {inward.items.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between gap-4 group/item pb-2 border-b border-border/40 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                                            style={{ backgroundColor: item.color.toLowerCase() }}
                                                        />
                                                        <div>
                                                            <div className="text-[11px] font-bold text-foreground leading-none">{item.color}</div>
                                                            <div className="text-[9px] text-muted font-medium mt-0.5">{item.materialId?.name || 'Fabric'} • {item.quantity}KG</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${item.status === 'Approved' ? 'bg-green-500/10 text-green-600' :
                                                            item.status === 'Rejected' ? 'bg-red-500/10 text-red-600' :
                                                                'bg-orange-500/10 text-orange-600'
                                                            }`}>
                                                            {item.status}
                                                            {item.status === 'Rejected' && item.rejectionCause && ` - ${item.rejectionCause}`}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {item.status !== 'Approved' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(inward._id, item._id, 'Approved')}
                                                                    className="p-1 hover:bg-green-500/20 text-green-600 rounded"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            {item.status !== 'Rejected' && (
                                                                <button
                                                                    onClick={() => openRejectionModal(inward._id, item._id)}
                                                                    className="p-1 hover:bg-red-500/20 text-red-600 rounded"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            {inward.items.some((i: any) => i.status === 'Pending') && (
                                                <button
                                                    onClick={async () => {
                                                        // Approve all pending items in this lot
                                                        const pending = inward.items.filter((i: any) => i.status === 'Pending');
                                                        for (const item of pending) {
                                                            await handleUpdateStatus(inward._id, item._id, 'Approved');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-primary text-white hover:opacity-90 rounded-lg text-xs font-bold shadow-sm"
                                                >
                                                    Approve Entire Lot
                                                </button>
                                            )}
                                            <div className="text-[9px] text-muted font-medium italic">
                                                Last Updated: {new Date(inward.updatedAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Cause Modal */}
            {isRejectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsRejectionModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Rejection Cause
                            </h3>
                            <button onClick={() => setIsRejectionModalOpen(false)} className="p-1 hover:bg-secondary rounded-md">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted mb-6">Please specify the primary reason for rejecting this fabric batch.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => selectedInwardId && selectedItemId && handleUpdateStatus(selectedInwardId, selectedItemId, 'Rejected', 'Color')}
                                className="flex flex-col items-center gap-3 p-4 border border-border rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                    <Edit className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">Color Mismatch</span>
                            </button>
                            <button
                                onClick={() => selectedInwardId && selectedItemId && handleUpdateStatus(selectedInwardId, selectedItemId, 'Rejected', 'Weight')}
                                className="flex flex-col items-center gap-3 p-4 border border-border rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-sm">Weight Issue</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsRejectionModalOpen(false)}
                            className="w-full mt-6 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
