'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Scissors,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    ChevronRight,
    Trash2,
    X
} from 'lucide-react';

export default function CuttingPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Approved Fabric available for cutting
    const [approvedInwards, setApprovedInwards] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        inwardId: '',
        fabricId: '',
        orderNo: '',
        cuttingSheet: [
            { size: '75', quantityDozens: 0, quantityPieces: 0 },
            { size: '80', quantityDozens: 0, quantityPieces: 0 },
            { size: '85', quantityDozens: 0, quantityPieces: 0 },
            { size: '90', quantityDozens: 0, quantityPieces: 0 },
            { size: '95', quantityDozens: 0, quantityPieces: 0 },
            { size: '100', quantityDozens: 0, quantityPieces: 0 },
        ],
        wastageKg: 0,
        rippedFabricKg: 0,
        totalFabricUsedKg: 0,
        remarks: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, inwardRes] = await Promise.all([
                fetch('/api/cutting'),
                fetch('/api/inward') // We'll filter for Approved in frontend for now
            ]);

            const ordersData = await ordersRes.json();
            const inwardData = await inwardRes.json();

            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setApprovedInwards(Array.isArray(inwardData) ? inwardData.filter((i: any) => i.status === 'Approved') : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSizeChange = (idx: number, dozens: number) => {
        const newSheet = [...formData.cuttingSheet];
        newSheet[idx].quantityDozens = dozens;
        newSheet[idx].quantityPieces = dozens * 12; // 1 Dozen = 12 Pieces
        setFormData({ ...formData, cuttingSheet: newSheet });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/cutting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleInwardSelect = (id: string) => {
        const selected = approvedInwards.find(i => i._id === id);
        if (selected) {
            setFormData({
                ...formData,
                inwardId: id,
                fabricId: selected.items[0]?.materialId || '', // Simplified for first item
                totalFabricUsedKg: selected.totalQuantity || 0
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Scissors className="w-6 h-6 text-primary" />
                        Cutting Orders
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage fabric cutting process and size-wise reports for LUX/Rupa.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    New Cutting Sheet
                </button>
            </div>

            {/* Orders List */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search cutting orders..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20Transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Showing {orders.length} orders</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Order Details</th>
                                <th className="px-6 py-4">Fabric Source</th>
                                <th className="px-6 py-4">Quantity (Pieces)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Scissors className="w-8 h-8 text-muted" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No Cutting Orders Found</h3>
                                        <p className="text-muted max-w-sm mx-auto mt-1">Start by creating a cutting sheet for your approved fabric lots.</p>
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{order.orderNo}</div>
                                        <div className="text-[10px] text-muted font-medium uppercase bg-secondary/50 px-1.5 py-0.5 rounded w-fit">
                                            {order.remarks || 'Standard Production'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{order.fabricId?.name || 'Fabric'}</div>
                                        <div className="text-xs text-muted">From: {order.inwardId?.challanNo || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-primary">
                                            {order.cuttingSheet.reduce((acc: number, curr: any) => acc + curr.quantityPieces, 0)} Pcs
                                        </div>
                                        <div className="text-[10px] text-muted">
                                            Input: {order.totalFabricUsedKg} KG
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${order.status === 'Approved' ? 'bg-green-500/10 text-green-600' :
                                                order.status === 'Submitted' ? 'bg-blue-500/10 text-blue-600' :
                                                    'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            {order.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                            <ChevronRight className="w-4 h-4 text-muted" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Create Cutting Sheet
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-card rounded-md">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto space-y-6">
                            {/* Step 1: Select Approved Fabric */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Select Approved Fabric Inward</label>
                                    <select
                                        required
                                        value={formData.inwardId}
                                        onChange={(e) => handleInwardSelect(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    >
                                        <option value="">-- Choose Approved Lot --</option>
                                        {approvedInwards.map(i => (
                                            <option key={i._id} value={i._id}>
                                                {i.challanNo} - {i.partyId?.name} ({i.totalQuantity} KG)
                                            </option>
                                        ))}
                                    </select>
                                    {approvedInwards.length === 0 && (
                                        <p className="text-[10px] text-orange-600 font-medium">Only "Approved" fabric lots appear here.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Order Number (Manual or Auto)</label>
                                    <input
                                        placeholder="Auto-generated if empty"
                                        value={formData.orderNo}
                                        onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            {/* Step 2: Size Grid */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    < Scissors className="w-4 h-4" />
                                    Size-wise Production (Dozens)
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    {formData.cuttingSheet.map((item, idx) => (
                                        <div key={item.size} className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-muted text-center block">Size {item.size}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.quantityDozens}
                                                onChange={(e) => handleSizeChange(idx, Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none text-center font-bold text-primary"
                                            />
                                            <p className="text-[10px] text-muted text-center">{item.quantityPieces} Pcs</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3: Wastage & Remarks */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Wastage (KG)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.wastageKg}
                                        onChange={(e) => setFormData({ ...formData, wastageKg: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Ripped Qty (KG)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.rippedFabricKg}
                                        onChange={(e) => setFormData({ ...formData, rippedFabricKg: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Remarks</label>
                                    <input
                                        placeholder="Special instructions..."
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            {/* Summary Footer */}
                            <div className="bg-secondary/20 p-4 rounded-xl flex items-center justify-between border border-border">
                                <div>
                                    <p className="text-xs text-muted">Total Fabric Used</p>
                                    <p className="font-bold">{formData.totalFabricUsedKg} KG</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted">Total Planned Production</p>
                                    <p className="font-bold text-primary text-lg">
                                        {formData.cuttingSheet.reduce((acc, curr) => acc + curr.quantityPieces, 0)} Pieces
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                                >
                                    Submit Cutting Sheet to LUX
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
