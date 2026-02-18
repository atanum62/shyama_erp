'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Truck,
    Trash2,
    Edit,
    X
} from 'lucide-react';

export default function InwardPage() {
    const [inwards, setInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // Dropdown data
    const [parties, setParties] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        partyId: '',
        type: 'Fabric',
        inwardDate: new Date().toISOString().split('T')[0],
        challanNo: '',
        lotNo: '',
        billNo: '',
        items: [{
            materialId: '',
            diameter: '',
            color: '',
            quantity: 0,
            unit: 'KG',
            lotNo: '',
            status: 'Pending',
            rejectionCause: ''
        }],
        remarks: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [inRes, pRes, mRes] = await Promise.all([
                fetch('/api/inward'),
                fetch('/api/masters/parties?type=DyeingHouse'),
                fetch('/api/masters/materials?category=Fabric')
            ]);

            const [inData, pData, mData] = await Promise.all([
                inRes.json(), pRes.json(), mRes.json()
            ]);

            setInwards(Array.isArray(inData) ? inData : []);
            setParties(pData);
            setMaterials(mData);
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
            items: [...formData.items, {
                materialId: '',
                diameter: '',
                color: '',
                quantity: 0,
                unit: 'KG',
                lotNo: '',
                status: 'Pending',
                rejectionCause: ''
            }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingItem ? `/api/inward/${editingItem._id}` : '/api/inward';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                closeModal();
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string, itemId?: string) => {
        const message = itemId ? 'Are you sure you want to delete this specific item?' : 'Are you sure you want to delete this entire receipt?';
        if (!confirm(message)) return;

        try {
            const url = itemId ? `/api/inward/${id}?itemId=${itemId}` : `/api/inward/${id}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            partyId: item.partyId?._id || item.partyId || '',
            type: item.type || 'Fabric',
            inwardDate: new Date(item.inwardDate).toISOString().split('T')[0],
            challanNo: item.challanNo || '',
            lotNo: item.items?.[0]?.lotNo || '',
            billNo: item.billNo || '',
            items: item.items.map((i: any) => ({
                materialId: i.materialId?._id || i.materialId || '',
                diameter: i.diameter || '',
                color: i.color || '',
                quantity: i.quantity || 0,
                unit: i.unit || 'KG',
                lotNo: i.lotNo || '',
                status: i.status || 'Pending',
                rejectionCause: i.rejectionCause || ''
            })),
            remarks: item.remarks || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            partyId: '',
            type: 'Fabric',
            inwardDate: new Date().toISOString().split('T')[0],
            challanNo: '',
            lotNo: '',
            billNo: '',
            items: [{
                materialId: '',
                diameter: '',
                color: '',
                quantity: 0,
                unit: 'KG',
                lotNo: '',
                status: 'Pending',
                rejectionCause: ''
            }],
            remarks: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Fabric Inward & Sampling</h1>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-border rounded-lg bg-card hover:bg-secondary transition-colors">
                        <Filter className="w-4 h-4 text-muted" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Record Dyeing Receipt
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                {/* ... table ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-xs font-bold text-muted uppercase tracking-wider border-b border-border">
                                <th className="px-6 py-4">Inward Details</th>
                                <th className="px-6 py-4">Dyeing House</th>
                                <th className="px-6 py-4">Fabric Color</th>
                                <th className="px-6 py-4">Fabric Item</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-muted">Loading transactions...</td></tr>
                            ) : inwards.length === 0 ? (
                                <tr><td colSpan={6} className="p-20 text-center">
                                    <Truck className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted">No fabric receipts found. Record your first receipt from a dyeing house.</p>
                                </td></tr>
                            ) : inwards.flatMap(inward => inward.items.map((item: any, idx: number) => (
                                <tr key={item._id || `${inward._id}-${idx}`} className="hover:bg-secondary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{inward.challanNo}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-muted font-medium bg-secondary/50 px-1.5 py-0.5 rounded w-fit">{new Date(inward.inwardDate).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-primary font-black bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-tight">Lot: {item.lotNo || inward.lotNo || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{inward.partyId?.name || 'Unknown'}</div>
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
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(inward)}
                                                className="p-1.5 hover:bg-primary/10 text-muted hover:text-primary rounded-lg transition-all"
                                                title="Edit Receipt"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(inward._id, item._id)}
                                                className="p-1.5 hover:bg-red-500/10 text-muted hover:text-red-500 rounded-lg transition-all"
                                                title="Delete Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingItem ? 'Edit' : 'Record'} Fabric Receipt</h2>
                            <button onClick={closeModal} className="p-1 hover:bg-card rounded-md">
                                <X className="w-6 h-6 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Dyeing House</label>
                                    <select
                                        required
                                        value={formData.partyId}
                                        onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    >
                                        <option value="">Select Party</option>
                                        {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {/* ... rest of form ... */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Inward Date</label>
                                    <input
                                        type="date"
                                        value={formData.inwardDate}
                                        onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Challan No.</label>
                                    <input
                                        placeholder="e.g. DY-9922"
                                        value={formData.challanNo}
                                        onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted">Lot No.</label>
                                    <input
                                        placeholder="e.g. 12345"
                                        value={formData.lotNo}
                                        onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-foreground">Items Received</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        + Add Color/Dia
                                    </button>
                                </div>
                                {formData.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-secondary/20 rounded-xl relative border border-border/50">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-muted">Fabric Type</label>
                                            <select
                                                value={item.materialId}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].materialId = e.target.value;
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg outline-none text-sm"
                                            >
                                                <option value="">Select</option>
                                                {materials.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                                {/* <option value="interlock">Interlock</option>
                                                <option value="rib">Rib</option> */}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-muted">Dia</label>
                                            <input
                                                placeholder="30"
                                                value={item.diameter}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].diameter = e.target.value;
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-muted">Color</label>
                                            <input
                                                placeholder="White"
                                                value={item.color}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].color = e.target.value;
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-muted">Wt (KG)</label>
                                            <input
                                                type="number"
                                                placeholder="100"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[idx].quantity = Number(e.target.value);
                                                    // newItems[idx].unit = e.target.value + "KG";
                                                    setFormData({ ...formData, items: newItems });
                                                }}
                                                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg outline-none text-sm"
                                            />
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-border flex gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                                >
                                    {editingItem ? 'Update Receipt' : 'Submit for Sampling'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
