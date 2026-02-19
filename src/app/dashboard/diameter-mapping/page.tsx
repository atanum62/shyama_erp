'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, X, ArrowLeft, AlertCircle, Ruler } from 'lucide-react';

function buildRow(diameter: string = '', size: string = '') {
    return { diameter, size };
}

export default function DiameterMappingPanel() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [rows, setRows] = useState<{ diameter: string; size: string }[]>([buildRow()]);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetch_(); }, []);

    const fetch_ = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/diameter-mapping');
            if (res.ok) setRecords(await res.json());
        } finally { setLoading(false); }
    };

    const openNew = () => {
        setEditingId(null);
        setProductName('');
        setRows([buildRow()]);
        setView('form');
    };

    const openEdit = (item: any) => {
        setEditingId(item._id);
        setProductName(item.productName);
        setRows(item.mappings.map((m: any) => ({ diameter: String(m.diameter), size: String(m.size) })));
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this mapping?')) return;
        await fetch(`/api/diameter-mapping/${id}`, { method: 'DELETE' });
        fetch_();
    };

    const updateRow = (idx: number, field: 'diameter' | 'size', val: string) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    };

    const addRow = () => setRows(prev => [...prev, buildRow()]);
    const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    const handleSave = async () => {
        if (!productName.trim()) return alert('Product name is required');
        const validRows = rows.filter(r => r.diameter.trim() && r.size.trim());
        if (validRows.length === 0) return alert('Add at least one diameter → size mapping');

        setSaving(true);
        try {
            const payload = {
                productName: productName.trim(),
                mappings: validRows.map(r => ({ diameter: Number(r.diameter), size: r.size.trim() }))
            };
            const url = editingId ? `/api/diameter-mapping/${editingId}` : '/api/diameter-mapping';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { setView('list'); fetch_(); }
            else { const e = await res.json(); alert(e.error || 'Save failed'); }
        } finally { setSaving(false); }
    };

    // ── FORM VIEW ──
    if (view === 'form') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-secondary rounded-xl border border-border transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{editingId ? `Edit: ${productName}` : 'New Diameter Mapping'}</h2>
                        <p className="text-muted text-sm">Map each fabric diameter to the product size it produces.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* Product Name */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <label className="text-[11px] font-black uppercase tracking-wider text-muted/70 mb-1.5 block">Product Name</label>
                    <input
                        autoFocus
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        placeholder="e.g. T-Shirt, Pant, Vest..."
                        className="w-full max-w-sm h-10 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-base transition-all"
                    />
                </div>

                {/* Mapping Table */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
                        <span className="text-sm font-black uppercase tracking-wider text-muted">Diameter → Size Mapping</span>
                        <button
                            onClick={addRow}
                            className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 flex items-center gap-1 border border-primary/20 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-secondary/20 text-[11px] font-black uppercase tracking-wider text-muted border-b border-border">
                                    <th className="px-6 py-3.5 text-left w-12">#</th>
                                    <th className="px-6 py-3.5 text-left min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <Ruler className="w-3.5 h-3.5" />
                                            Fabric Diameter (cm/inch)
                                        </div>
                                    </th>
                                    <th className="px-6 py-3.5 text-left min-w-[180px]">Cut Size (cm)</th>
                                    <th className="w-14"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-secondary/5 transition-colors">
                                        <td className="px-6 py-3 text-xs font-bold text-muted/50">{idx + 1}</td>
                                        <td className="px-6 py-2.5">
                                            <input
                                                type="number"
                                                value={row.diameter}
                                                onChange={e => updateRow(idx, 'diameter', e.target.value)}
                                                placeholder="e.g. 15"
                                                className="w-full h-9 px-3 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-2.5">
                                            <input
                                                type="text"
                                                value={row.size}
                                                onChange={e => updateRow(idx, 'size', e.target.value)}
                                                placeholder="e.g. 80"
                                                className="w-full h-9 px-3 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                                            />
                                        </td>
                                        <td className="px-3 text-center">
                                            <button
                                                onClick={() => removeRow(idx)}
                                                disabled={rows.length === 1}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg text-muted disabled:opacity-0 transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-3 border-t border-border/50 bg-secondary/5">
                        <div className="flex items-start gap-2 text-xs text-muted">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-500" />
                            Each fabric diameter corresponds to exactly one cut size for this product.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── LIST VIEW ──
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Diameter → Size Mapping</h2>
                    <p className="text-muted text-sm">Which fabric diameter produces which product size.</p>
                </div>
                <button
                    onClick={openNew}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted">Loading...</div>
            ) : records.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <Ruler className="w-10 h-10 mx-auto mb-3 text-muted/30" />
                    <h3 className="font-bold">No Mappings Yet</h3>
                    <p className="text-muted text-sm mb-4">Add your first diameter → size mapping.</p>
                    <button onClick={openNew} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm">+ Add Product</button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {records.map(item => (
                        <div key={item._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary">
                                        {item.productName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black">{item.productName}</h3>
                                        <span className="text-xs text-muted">{item.mappings.length} diameter{item.mappings.length !== 1 ? 's' : ''} configured</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(item)} className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 font-bold text-xs rounded-lg flex items-center gap-1 border border-border transition-colors">
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-muted transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mapping Pills */}
                            <div className="px-6 py-4 flex flex-wrap gap-3">
                                {item.mappings
                                    .slice()
                                    .sort((a: any, b: any) => a.diameter - b.diameter)
                                    .map((m: any, i: number) => (
                                        <div key={i} className="flex items-center gap-0 rounded-xl overflow-hidden border border-border shadow-sm">
                                            <div className="px-3 py-2 bg-secondary/40 text-xs font-black text-muted uppercase tracking-wide border-r border-border">
                                                Dia {m.diameter}
                                            </div>
                                            <div className="px-3 py-2 bg-primary/5 text-primary font-black text-sm">
                                                {m.size} cm
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
