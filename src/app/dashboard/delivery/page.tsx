'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Truck,
    CheckCircle2,
    Clock,
    FileText,
    Package,
    ArrowRight,
    MoreVertical,
    X,
    MapPin,
    Calendar
} from 'lucide-react';

export default function DeliveryPage() {
    const [challans, setChallans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dropdown Data
    const [clients, setClients] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        challanNo: '',
        clientId: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        vehicleNo: '',
        driverName: '',
        gatePassNo: '',
        items: [
            { itemType: 'FinishedGood', description: '', quantity: 0, unit: 'PCS', size: '', lotNo: '', remarks: '' }
        ],
        status: 'Dispatched'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [challansRes, clientRes] = await Promise.all([
                fetch('/api/delivery'),
                fetch('/api/masters/parties?type=Client')
            ]);

            const [cData, clData] = await Promise.all([
                challansRes.json(), clientRes.json()
            ]);

            setChallans(Array.isArray(cData) ? cData : []);
            setClients(Array.isArray(clData) ? clData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemType: 'FinishedGood', description: '', quantity: 0, unit: 'PCS', size: '', lotNo: '', remarks: '' }]
        });
    };

    const handleRemoveItem = (idx: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== idx)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/delivery', {
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

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Truck className="w-6 h-6 text-primary" />
                        Delivery & Dispatch
                    </h1>
                    <p className="text-muted text-sm mt-1">Generate delivery challans and track lot-wise dispatches to LUX/Rupa.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Challan
                </button>
            </div>

            {/* List View */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Challan No</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Items Qty</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-muted text-sm">Loading delivery records...</td></tr>
                            ) : challans.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="w-8 h-8 text-muted" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No Deliveries Found</h3>
                                        <p className="text-muted max-w-sm mx-auto mt-1">Dispatch your finished goods to LUX using the "Create Challan" button.</p>
                                    </td>
                                </tr>
                            ) : challans.map((c) => (
                                <tr key={c._id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{c.challanNo}</div>
                                        <div className="text-[10px] text-muted font-mono">{c.gatePassNo || 'INTERNAL'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{c.clientId?.name}</div>
                                        <div className="text-[10px] text-muted uppercase">{c.vehicleNo}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{new Date(c.deliveryDate).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-primary">
                                            {c.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0)} {c.items[0]?.unit}
                                        </div>
                                        <div className="text-[10px] text-muted uppercase">
                                            {c.items.length} Line Items
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${c.status === 'Delivered' ? 'bg-green-500/10 text-green-600' :
                                            'bg-blue-500/10 text-blue-600'
                                            }`}>
                                            {c.status === 'Delivered' ? <CheckCircle2 className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                                            {c.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                            <FileText className="w-4 h-4 text-muted" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                New Delivery Challan
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-card rounded-md">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto space-y-6">
                            {/* Logistics info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Client (Receiver)</label>
                                    <select
                                        required
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(cl => <option key={cl._id} value={cl._id}>{cl.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Delivery Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Vehicle No / Driver</label>
                                    <input
                                        placeholder="WB 19 XX ..."
                                        value={formData.vehicleNo}
                                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    />
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pt-2">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <Package className="w-4 h-4 text-primary" />
                                        Dispatched Goods
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-secondary/20 rounded-2xl border border-border items-end">
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Item Description</label>
                                                <input
                                                    placeholder="Interlock Vest Size 90"
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].description = e.target.value;
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Lot No / Size</label>
                                                <input
                                                    placeholder="LOT-101 / 95"
                                                    value={item.lotNo}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].lotNo = e.target.value;
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].quantity = Number(e.target.value);
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-center font-bold"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Unit</label>
                                                <input
                                                    value={item.unit}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].unit = e.target.value;
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Remarks</label>
                                                <input
                                                    placeholder="QC Checked"
                                                    value={item.remarks}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].remarks = e.target.value;
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-[10px]"
                                                />
                                            </div>
                                            <div className="md:col-span-1 flex justify-center pb-1">
                                                {idx > 0 && (
                                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-600">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex gap-4">
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
                                    Confirm Dispatch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

