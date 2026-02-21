'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    UserCircle,
    CheckCircle2,
    Clock,
    AlertCircle,
    Package,
    Truck,
    X,
    MoreVertical,
    Trash2
} from 'lucide-react';

export default function StitchingPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Receipt/QC State
    const [receivingOrder, setReceivingOrder] = useState<any>(null);
    const [receiveData, setReceiveData] = useState({
        addReceived: 0,
        addRejected: 0,
        status: 'In Progress'
    });

    // Dropdown Data
    const [stitchers, setStitchers] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [approvedCutting, setApprovedCutting] = useState<any[]>([]);
    const [availableAccessories, setAvailableAccessories] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        stitcherId: '',
        clientId: '',
        description: '',
        expectedDeliveryDate: '',
        issuedItems: [
            { itemType: 'CuttingPanel', materialId: '', quantity: 0, unit: 'PCS' }
        ],
        remarks: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, stitcherRes, clientRes, cuttingRes, accessoryRes] = await Promise.all([
                fetch('/api/stitching'),
                fetch('/api/masters/stitchers'),
                fetch('/api/masters/parties?type=Client'),
                fetch('/api/cutting'),
                fetch('/api/masters/materials?category=Accessory')
            ]);

            const [oData, sData, cData, ctData, aData] = await Promise.all([
                ordersRes.json(), stitcherRes.json(), clientRes.json(), cuttingRes.json(), accessoryRes.json()
            ]);

            setOrders(Array.isArray(oData) ? oData : []);
            setStitchers(Array.isArray(sData) ? sData : []);
            setClients(Array.isArray(cData) ? cData : []);
            setApprovedCutting(Array.isArray(ctData) ? ctData.filter((c: any) => c.status === 'Approved' || c.status === 'Submitted') : []);
            setAvailableAccessories(Array.isArray(aData) ? aData : []);
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
            issuedItems: [...formData.issuedItems, { itemType: 'Accessory', materialId: '', quantity: 0, unit: 'PCS' }]
        });
    };

    const handleRemoveItem = (idx: number) => {
        setFormData({
            ...formData,
            issuedItems: formData.issuedItems.filter((_, i) => i !== idx)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/stitching', {
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

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/stitching/${receivingOrder._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiveData)
            });
            if (res.ok) {
                setReceivingOrder(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase">Active Units</p>
                    <h3 className="text-xl font-bold mt-1">{[...new Set(orders.map(o => o.stitcherId?._id))].length} Stitchers</h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase">Pending Work</p>
                    <h3 className="text-xl font-bold mt-1 text-orange-600">
                        {orders.reduce((acc, o) => acc + (o.issuedItems?.find((i: any) => i.itemType === 'CuttingPanel')?.quantity || 0) - o.receivedQuantity, 0)} Pcs
                    </h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase">QC Pass Today</p>
                    <h3 className="text-xl font-bold mt-1 text-green-600">0 Pcs</h3>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <p className="text-xs font-medium text-muted uppercase">Pending Payments</p>
                    <h3 className="text-xl font-bold mt-1">₹ 0</h3>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-primary" />
                        Stitching & QC Receipt
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage work issuance and receive finished goods from stitchers.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 shadow-lg shadow-primary/20 scale-100 hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" />
                    New Work Order
                </button>
            </div>

            {/* List View */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Work Order</th>
                                <th className="px-6 py-4">Stitcher / Client</th>
                                <th className="px-6 py-4">Progress Bar</th>
                                <th className="px-6 py-4">QC Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-10 text-center text-muted text-sm">Loading active work orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="w-8 h-8 text-muted" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground">No Active Work Orders</h3>
                                        <p className="text-muted max-w-sm mx-auto mt-1">Issue Panels and Accessories to your stitchers to begin tracking.</p>
                                    </td>
                                </tr>
                            ) : orders.map((order) => {
                                const issuedQty = order.issuedItems?.find((i: any) => i.itemType === 'CuttingPanel')?.quantity || 1;
                                const progress = (order.receivedQuantity / issuedQty) * 100;
                                return (
                                    <tr key={order._id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{order.workOrderNo}</div>
                                            <div className="text-[10px] text-muted font-mono">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold">{order.stitcherId?.name}</div>
                                            <div className="text-[10px] text-muted uppercase">For: {order.clientId?.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden max-w-[120px]">
                                                <div
                                                    className={`h-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted mt-1 uppercase">
                                                {order.receivedQuantity} / {issuedQty} Pcs
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> {order.receivedQuantity} OK
                                                </div>
                                                {order.rejectedQuantity > 0 && (
                                                    <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold">
                                                        <AlertCircle className="w-3 h-3" /> {order.rejectedQuantity} FAIL
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setReceivingOrder(order);
                                                    setReceiveData({ addReceived: 0, addRejected: 0, status: order.status });
                                                }}
                                                className="px-3 py-1 bg-secondary text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                            >
                                                Receive & QC
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Work Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                New Stitching Work Order
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-card rounded-md">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Stitcher Unit</label>
                                    <select
                                        required
                                        value={formData.stitcherId}
                                        onChange={(e) => setFormData({ ...formData, stitcherId: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Stitcher</option>
                                        {stitchers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Client </label>
                                    <select
                                        required
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Expected Date</label>
                                    <input
                                        type="date"
                                        value={formData.expectedDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Description</label>
                                    <input
                                        placeholder="e.g. Interlock Vest Production"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm outline-none"
                                    />
                                </div>
                            </div>

                            {/* Issued Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-primary" />
                                        Items to Issue (Fabric + Accessories)
                                    </h3>
                                    <button type="button" onClick={handleAddItem} className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">+ Add Accessory</button>
                                </div>
                                <div className="space-y-3">
                                    {formData.issuedItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-secondary/20 rounded-2xl border border-border items-end">
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Type</label>
                                                <select value={item.itemType} onChange={(e: any) => { const newItems = [...formData.issuedItems]; newItems[idx].itemType = e.target.value; setFormData({ ...formData, issuedItems: newItems }); }} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm outline-none"><option value="CuttingPanel">Cutting Panel</option><option value="Accessory">Accessory</option></select>
                                            </div>
                                            <div className="md:col-span-5 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Select Item</label>
                                                <select required value={item.materialId} onChange={(e) => { const newItems = [...formData.issuedItems]; newItems[idx].materialId = e.target.value; setFormData({ ...formData, issuedItems: newItems }); }} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm outline-none font-medium"><option value="">-- Choose Item --</option>{item.itemType === 'CuttingPanel' ? approvedCutting.map(c => <option key={c._id} value={c._id}>{c.orderNo}</option>) : availableAccessories.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}</select>
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Quantity</label>
                                                <input type="number" value={item.quantity} onChange={(e) => { const newItems = [...formData.issuedItems]; newItems[idx].quantity = Number(e.target.value); setFormData({ ...formData, issuedItems: newItems }); }} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-center font-bold" />
                                            </div>
                                            <div className="md:col-span-1 space-y-1">
                                                <label className="text-[10px] font-bold uppercase text-muted">Unit</label>
                                                <input value={item.unit} onChange={(e) => { const newItems = [...formData.issuedItems]; newItems[idx].unit = e.target.value; setFormData({ ...formData, issuedItems: newItems }); }} className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs" />
                                            </div>
                                            <div className="md:col-span-1 flex justify-center pb-1">{idx > 0 && <button onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 className="w-5 h-5" /></button>}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary">Cancel</button>
                                <button type="submit" className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Issue Work Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Goods Modal */}
            {receivingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setReceivingOrder(null)} />
                    <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Receive from {receivingOrder.stitcherId?.name}</h2>
                                <p className="text-xs text-muted">WO: {receivingOrder.workOrderNo}</p>
                            </div>
                            <button onClick={() => setReceivingOrder(null)} className="p-1 hover:bg-card rounded-md"><X className="w-6 h-6 text-muted" /></button>
                        </div>
                        <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">QC Approved Pcs</label>
                                    <input type="number" required className="w-full px-4 py-2 bg-background border border-border rounded-xl text-lg font-bold text-green-600" value={receiveData.addReceived} onChange={(e) => setReceiveData({ ...receiveData, addReceived: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted">Rejected Pcs</label>
                                    <input type="number" required className="w-full px-4 py-2 bg-background border border-border rounded-xl text-lg font-bold text-red-600" value={receiveData.addRejected} onChange={(e) => setReceiveData({ ...receiveData, addRejected: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted">Order Status</label>
                                <select className="w-full px-4 py-2 bg-background border border-border rounded-xl" value={receiveData.status} onChange={(e) => setReceiveData({ ...receiveData, status: e.target.value })}>
                                    <option value="Issued">Issued</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setReceivingOrder(null)} className="flex-1 py-3 font-bold text-muted hover:bg-secondary rounded-xl">Cancel</button>
                                <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Record QC Receipt</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
