'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Filter, AlertCircle, Clock, Truck, CheckCircle2, XCircle, X, Palette } from 'lucide-react';

export default function FabricReturnPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Rereceive Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [newColor, setNewColor] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inward');
            if (res.ok) {
                const data = await res.json();
                setInwards(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const flattenedItems = inwards.flatMap(inward =>
        inward.items.filter((item: any) => item.status === 'Rejected' && item.rejectionCause === 'Color')
            .map((item: any) => ({
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
        (item.lotNo || item.globalLotNo)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUpdateReturnStatus = async (inwardId: string, itemId: string, returnStatus: string) => {
        try {
            const res = await fetch(`/api/inward/${inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    returnStatus,
                    itemId
                })
            });
            if (res.ok) {
                await fetchData();
            }
        } catch (err) {
            console.error('Update return status error:', err);
        }
    };

    const openRereceiveModal = (item: any) => {
        setSelectedItem(item);
        setNewColor(item.color);
        setIsModalOpen(true);
    };

    const handleRereceiveAndReset = async () => {
        if (!selectedItem || !newColor) return;

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/inward/${selectedItem.inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'Pending',
                    rejectionCause: '',
                    returnStatus: '',
                    color: newColor,
                    itemId: selectedItem._id
                })
            });
            if (res.ok) {
                setIsModalOpen(false);
                await fetchData();
            }
        } catch (err) {
            console.error('Rereceive error:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Fabric Return Management</h1>
                    <p className="text-muted text-sm">Track and manage returns to dyeing houses for rejected fabric items.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search returns..."
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
                                <th className="px-6 py-4 text-center">Reason</th>
                                <th className="px-6 py-4 text-center">Return Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center text-muted">Loading return items...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center">
                                    <RotateCcw className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No pending color returns found.</p>
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
                                        <div className="text-[11px] text-muted">
                                            {item.materialId?.name || 'Fabric'} • Dia {item.diameter}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit bg-red-500/10 text-red-600">
                                                <XCircle className="w-3 h-3" />
                                                REJECTED
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/70 ml-1">
                                                CAUSE: {item.rejectionCause}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${(item.returnStatus === 'Returned')
                                            ? 'bg-blue-500/10 text-blue-600'
                                            : 'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            {item.returnStatus === 'Returned' ? <Truck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {item.returnStatus || 'Pending'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            {(item.returnStatus === 'Returned') ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateReturnStatus(item.inwardId, item._id, 'Pending')}
                                                        className="p-1.5 bg-secondary hover:bg-secondary/80 text-muted-foreground rounded-lg transition-all border border-border group/reset"
                                                        title="Reset to Pending"
                                                    >
                                                        <RotateCcw className="w-4 h-4 group-hover/reset:rotate-[-45deg] transition-transform" />
                                                    </button>
                                                    <button
                                                        onClick={() => openRereceiveModal(item)}
                                                        className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm flex items-center gap-1"
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Rereceived
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpdateReturnStatus(item.inwardId, item._id, 'Returned')}
                                                    className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    <Truck className="w-3 h-3" />
                                                    Return
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rereceive Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Palette className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">Rereceived Redyed Fabric</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-secondary/30 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Challan No:</span>
                                    <span className="font-bold">{selectedItem?.challanNo}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Fabric Type:</span>
                                    <span className="font-bold">{selectedItem?.materialId?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">Original Color:</span>
                                    <span className="font-bold text-red-500">{selectedItem?.color}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground ml-1">New Redyed Color</label>
                                <div className="relative">
                                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        placeholder="Enter new color name..."
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg font-bold"
                                    />
                                </div>
                                <p className="text-[10px] text-muted ml-1 italic">* This will update the fabric color and reset inspection status to Pending.</p>
                            </div>
                        </div>

                        <div className="p-6 bg-secondary/10 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-border bg-card hover:bg-secondary text-foreground font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRereceiveAndReset}
                                disabled={isUpdating || !newColor}
                                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUpdating ? 'Updating...' : 'Confirm Rereceive'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
