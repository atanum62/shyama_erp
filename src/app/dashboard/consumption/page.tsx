'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Edit2, X, PlusCircle, ChevronDown, ArrowLeft, Check } from 'lucide-react';

const DEFAULT_COMPONENTS = ['Body Weight', 'Wastage', 'Interlock', 'Rib'];
const DEFAULT_SIZES = ['75', '80', '85', '90', '95', '100', '105', '110'];
const UNIT_LABEL = 'kg/doz';

function buildEmptyVariation(size: string, components: string[]) {
    return {
        size,
        consumption: components.map(name => ({ name, value: '', unit: 'kg' }))
    };
}

export default function ConsumptionPage() {
    const [consumptions, setConsumptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [unit, setUnit] = useState('Dozen');
    const [components, setComponents] = useState<string[]>(DEFAULT_COMPONENTS);
    const [variations, setVariations] = useState<any[]>([]);
    const [newCompName, setNewCompName] = useState('');
    const [newSizeVal, setNewSizeVal] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchConsumptions(); fetchProducts(); }, []);

    const fetchConsumptions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/consumption');
            if (res.ok) setConsumptions(await res.json());
        } finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/masters/products');
            if (res.ok) setProducts(await res.json());
        } catch { /* silent */ }
    };

    const openNew = () => {
        setEditingId(null);
        setProductName('');
        setUnit('Dozen');
        setComponents([...DEFAULT_COMPONENTS]);
        setVariations(DEFAULT_SIZES.map(s => buildEmptyVariation(s, DEFAULT_COMPONENTS)));
        setView('form');
    };

    const openEdit = (item: any) => {
        setEditingId(item._id);
        setProductName(item.productName);
        setUnit(item.unit || 'Dozen');
        setComponents(item.definedComponents || DEFAULT_COMPONENTS);
        setVariations(item.variations || []);
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product consumption?')) return;
        await fetch(`/api/consumption/${id}`, { method: 'DELETE' });
        fetchConsumptions();
    };

    // --- Form helpers ---
    const updateCell = (vIdx: number, cIdx: number, val: string) => {
        setVariations(prev => {
            const next = prev.map(v => ({ ...v, consumption: [...v.consumption] }));
            next[vIdx].consumption[cIdx] = { ...next[vIdx].consumption[cIdx], value: val };
            return next;
        });
    };

    const addComponent = () => {
        const name = newCompName.trim();
        if (!name || components.includes(name)) return;
        setComponents(prev => [...prev, name]);
        setVariations(prev => prev.map(v => ({
            ...v,
            consumption: [...v.consumption, { name, value: '', unit: 'kg' }]
        })));
        setNewCompName('');
    };

    const removeComponent = (idx: number) => {
        if (!confirm(`Remove column "${components[idx]}"?`)) return;
        setComponents(prev => prev.filter((_, i) => i !== idx));
        setVariations(prev => prev.map(v => ({
            ...v,
            consumption: v.consumption.filter((_: any, i: number) => i !== idx)
        })));
    };

    const addSize = () => {
        const s = newSizeVal.trim();
        if (!s || variations.some(v => v.size === s)) return;
        setVariations(prev => [...prev, buildEmptyVariation(s, components)]);
        setNewSizeVal('');
    };

    const removeSize = (idx: number) => {
        setVariations(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!productName.trim()) return alert('Product Name is required');
        setSaving(true);
        try {
            // Normalise: convert string values to numbers
            const normVariations = variations.map(v => ({
                ...v,
                consumption: v.consumption.map((c: any) => ({ ...c, value: parseFloat(c.value) || 0 }))
            }));

            const payload = { productName: productName.trim(), unit, definedComponents: components, variations: normVariations };
            const url = editingId ? `/api/consumption/${editingId}` : '/api/consumption';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { setView('list'); fetchConsumptions(); }
            else { const e = await res.json(); alert(e.error || 'Save failed'); }
        } finally { setSaving(false); }
    };

    // ===================== FORM VIEW =====================
    if (view === 'form') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-secondary rounded-xl border border-border transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">
                            {editingId ? `Edit: ${productName}` : 'New Product Consumption'}
                        </h1>
                        <p className="text-muted text-sm">Fill in consumption values per size for each material component.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* Product Info */}
                <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap gap-6 items-end shadow-sm">
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Product Name</label>
                        <select
                            value={productName}
                            onChange={e => setProductName(e.target.value)}
                            className="w-full h-10 px-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-base transition-all appearance-none cursor-pointer"
                        >
                            <option value="">— Select a Product —</option>
                            {products.map(p => (
                                <option key={p._id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                        {products.length === 0 && (
                            <p className="text-[10px] text-orange-500 font-bold">⚠ No products found. Add products in Masters → Products first.</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Consumption Per</label>
                        <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            className="h-10 px-4 bg-background border border-border rounded-xl outline-none font-bold appearance-none pr-8"
                        >
                            <option value="Dozen">Dozen (12 pcs)</option>
                            <option value="Pcs">Piece</option>
                        </select>
                    </div>
                </div>

                {/* Spreadsheet Area */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-3 p-4 border-b border-border bg-secondary/10 items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-muted">Add:</span>
                        {/* Add Size */}
                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg overflow-hidden">
                            <input
                                type="number"
                                value={newSizeVal}
                                onChange={e => setNewSizeVal(e.target.value)}
                                placeholder="Size (e.g. 75)"
                                className="w-32 px-3 py-1.5 bg-transparent outline-none text-sm font-bold"
                                onKeyDown={e => e.key === 'Enter' && addSize()}
                            />
                            <button onClick={addSize} className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 border-l border-border transition-colors">+ Row</button>
                        </div>
                        {/* Add Component */}
                        <div className="flex items-center gap-1 bg-background border border-border rounded-lg overflow-hidden">
                            <input
                                type="text"
                                value={newCompName}
                                onChange={e => setNewCompName(e.target.value)}
                                placeholder="Component (e.g. Lycra)"
                                className="w-44 px-3 py-1.5 bg-transparent outline-none text-sm font-bold"
                                onKeyDown={e => e.key === 'Enter' && addComponent()}
                            />
                            <button onClick={addComponent} className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 border-l border-border transition-colors">+ Col</button>
                        </div>
                        <span className="ml-auto text-[10px] text-muted font-bold uppercase tracking-wider">All values in kg/{unit === 'Dozen' ? 'doz' : 'pc'}</span>
                    </div>

                    {/* The Spreadsheet Table */}
                    <div className="overflow-auto max-h-[60vh] border-t border-border">
                        <table className="w-full border-collapse table-fixed">
                            <thead>
                                <tr className="bg-secondary/30 sticky top-0 z-30">
                                    <th className="sticky left-0 top-0 z-40 bg-secondary px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-muted border-b border-r border-border min-w-[100px] w-[100px]">
                                        Size
                                    </th>
                                    {components.map((comp, cIdx) => (
                                        <th key={cIdx} className="bg-secondary/30 px-4 py-3 text-center text-[11px] font-black uppercase tracking-wider text-muted border-b border-r border-border min-w-[140px] group relative">
                                            <span>{comp}</span>
                                            <div className="text-[9px] text-muted/50 font-bold normal-case tracking-normal">kg/{unit === 'Dozen' ? 'doz' : 'pc'}</div>
                                            <button
                                                onClick={() => removeComponent(cIdx)}
                                                className="absolute top-1.5 right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 hover:text-red-500 rounded text-muted/40 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 border-b border-border w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {variations.map((v, vIdx) => (
                                    <tr key={vIdx} className="group hover:bg-primary/5 transition-colors">
                                        {/* Size label */}
                                        <td className="sticky left-0 z-20 bg-card group-hover:bg-primary/10 transition-colors px-5 py-3 border-r border-border font-black text-foreground shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            {v.size}<span className="text-muted font-medium text-xs ml-0.5">cm</span>
                                        </td>
                                        {/* Values */}
                                        {components.map((comp, cIdx) => {
                                            const cell = v.consumption.find((c: any) => c.name === comp);
                                            const realIdx = v.consumption.findIndex((c: any) => c.name === comp);
                                            return (
                                                <td key={cIdx} className="px-2 py-1.5 border-r border-border/50 text-center">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0"
                                                        value={realIdx >= 0 ? (v.consumption[realIdx].value ?? '') : ''}
                                                        onChange={e => realIdx >= 0 && updateCell(vIdx, realIdx, e.target.value)}
                                                        className="w-full text-center bg-transparent border border-transparent focus:border-primary/50 focus:bg-primary/5 outline-none py-1 px-2 font-bold rounded-lg transition-all text-sm hover:bg-secondary/30"
                                                        placeholder="0.000"
                                                    />
                                                </td>
                                            );
                                        })}
                                        {/* Remove row */}
                                        <td className="px-2 text-center">
                                            <button
                                                onClick={() => removeSize(vIdx)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-muted"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {variations.length === 0 && (
                                    <tr>
                                        <td colSpan={components.length + 2} className="p-12 text-center text-muted">
                                            No sizes yet — click "+ Row" to add.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== LIST VIEW =====================
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Consumption Master</h1>
                    <p className="text-muted text-sm">Material usage standards per product & size.</p>
                </div>
                <button
                    onClick={openNew}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-muted">Loading...</div>
            ) : consumptions.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-2xl">
                    <PlusCircle className="w-12 h-12 mx-auto mb-3 text-muted/30" />
                    <h3 className="font-bold text-lg">No Products Yet</h3>
                    <p className="text-muted text-sm">Add your first product consumption standard.</p>
                    <button onClick={openNew} className="mt-4 px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
                        + Add Product
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {consumptions.map(item => (
                        <div key={item._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            {/* Product Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-lg">
                                        {item.productName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg">{item.productName}</h3>
                                        <span className="text-xs text-muted font-bold">Per {item.unit} &bull; {item.variations.length} sizes</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(item)} className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors border border-border">
                                        <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(item._id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-muted transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Spreadsheet Preview */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/5">
                                            <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted border-b border-r border-border/50 sticky left-0 bg-secondary/5">
                                                Size
                                            </th>
                                            {item.definedComponents.map((comp: string, i: number) => (
                                                <th key={i} className="px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-muted border-b border-r border-border/50 min-w-[110px]">
                                                    {comp}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.variations.map((v: any, vIdx: number) => (
                                            <tr key={vIdx} className="hover:bg-secondary/10 border-b border-border/40 last:border-0 transition-colors">
                                                <td className="px-5 py-2.5 font-black text-foreground border-r border-border/50 sticky left-0 bg-card">
                                                    {v.size}<span className="text-muted text-xs font-medium">cm</span>
                                                </td>
                                                {item.definedComponents.map((comp: string, cIdx: number) => {
                                                    const cell = v.consumption.find((c: any) => c.name === comp);
                                                    const val = cell ? Number(cell.value) : 0;
                                                    return (
                                                        <td key={cIdx} className="px-4 py-2.5 text-center border-r border-border/50 font-bold">
                                                            {val > 0 ? (
                                                                <span className="text-foreground">{val.toFixed(3)}</span>
                                                            ) : (
                                                                <span className="text-muted/30">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
