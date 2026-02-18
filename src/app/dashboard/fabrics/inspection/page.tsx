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

    const flattenedItems = inwards.flatMap(inward =>
        inward.items.map((item: any) => ({
            ...item,
            inwardId: inward._id,
            challanNo: inward.challanNo,
            partyName: inward.partyId?.name,
            inwardDate: inward.inwardDate,
            globalLotNo: inward.lotNo
        }))
    );

    const filteredItems = flattenedItems.filter(item =>
        item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                <th className="px-6 py-4">Inward Details</th>
                                <th className="px-6 py-4">Dyeing House</th>
                                <th className="px-6 py-4">Fabric Color</th>
                                <th className="px-6 py-4">Fabric Item</th>
                                <th className="px-6 py-4">Status & Cause</th>
                                <th className="px-6 py-4 text-right">Inspection Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center">
                                    <AlertCircle className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No pending inspections found.</p>
                                </td></tr>
                            ) : filteredItems.map((item, idx) => (
                                <tr key={item._id || `${item.inwardId}-${idx}`} className="hover:bg-secondary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{item.challanNo}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit">{new Date(item.inwardDate).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tight">Lot: {item.lotNo || item.globalLotNo || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{item.partyName || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-border shadow-sm"
                                                style={{ backgroundColor: item.color.toLowerCase() }}
                                            ></div>
                                            <span className="text-sm font-semibold text-foreground uppercase tracking-tight">{item.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-primary">{item.quantity} KG</div>
                                        <div className="text-[10px] text-muted">
                                            {item.materialId?.name || 'Fabric'} • Dia {item.diameter}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${item.status === 'Approved' ? 'bg-green-500/10 text-green-600' :
                                                item.status === 'Rejected' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-orange-500/10 text-orange-600'
                                                }`}>
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </div>
                                            {item.status === 'Rejected' && item.rejectionCause && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                    {item.rejectionCause}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {item.status !== 'Approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.inwardId, item._id, 'Approved')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition-all text-xs font-bold"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            )}
                                            {item.status !== 'Rejected' && (
                                                <button
                                                    onClick={() => openRejectionModal(item.inwardId, item._id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-all text-xs font-bold"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            )}
                                            {item.status === 'Approved' || item.status === 'Rejected' ? (
                                                <button
                                                    onClick={() => handleUpdateStatus(item.inwardId, item._id, 'Received', undefined)}
                                                    className="text-[10px] text-muted hover:text-foreground underline decoration-dotted"
                                                >
                                                    Reset
                                                </button>
                                            ) : null}
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
