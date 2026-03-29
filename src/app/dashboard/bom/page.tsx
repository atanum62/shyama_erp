'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, ArrowLeft, Package } from 'lucide-react';

export default function BOMPage() {
    const [boms, setBoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');
    
    // Masters Data
    const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [unit, setUnit] = useState('Dozen');
    const [bomMaterials, setBomMaterials] = useState<{ name: string; quantity: number|string; unit: string }[]>([]);
    
    const [saving, setSaving] = useState(false);

    useEffect(() => { 
        fetchBoms(); 
        fetchProducts(); 
        fetchMaterials(); 
    }, []);

    const fetchBoms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bom');
            if (res.ok) setBoms(await res.json());
        } finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/masters/products');
            if (res.ok) setProducts(await res.json());
        } catch { /* silent */ }
    };

    const fetchMaterials = async () => {
        try {
            // Primarily want packaging & accessories, but we fetch all
            const res = await fetch('/api/masters/materials');
            if (res.ok) setMaterials(await res.json());
        } catch { /* silent */ }
    };

    const openNew = () => {
        setEditingId(null);
        setProductName('');
        setUnit('Dozen');
        setBomMaterials([]);
        setView('form');
    };

    const openEdit = (item: any) => {
        setEditingId(item._id);
        setProductName(item.productName);
        setUnit(item.unit || 'Dozen');
        setBomMaterials(item.materials || []);
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this Bill of Materials?')) return;
        await fetch(`/api/bom/${id}`, { method: 'DELETE' });
        fetchBoms();
    };

    const handleSave = async () => {
        if (!productName.trim()) return alert('Product Name is required');
        
        // Clean empty rows and parse numbers
        const cleanedMaterials = bomMaterials
            .filter(m => m.name.trim() !== '')
            .map(m => ({
                name: m.name,
                quantity: parseFloat(String(m.quantity)) || 0,
                unit: m.unit || 'PCS'
            }));

        if (cleanedMaterials.length === 0) return alert('Add at least one material component.');

        setSaving(true);
        try {
            const payload = { productName: productName.trim(), unit, materials: cleanedMaterials };
            const url = editingId ? `/api/bom/${editingId}` : '/api/bom';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            
            if (res.ok) { 
                setView('list'); 
                fetchBoms(); 
            } else { 
                const e = await res.json(); 
                alert(e.error || 'Save failed'); 
            }
        } finally { setSaving(false); }
    };

    const addMaterialRow = () => {
        setBomMaterials(prev => [...prev, { name: '', quantity: '', unit: 'PCS' }]);
    };

    const removeMaterialRow = (idx: number) => {
        setBomMaterials(prev => prev.filter((_, i) => i !== idx));
    };

    const updateMaterialRow = (idx: number, field: string, val: string) => {
        setBomMaterials(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            
            // Auto set unit when material is selected
            if (field === 'name') {
                const mat = materials.find(m => m.name === val);
                if (mat) {
                    next[idx].unit = mat.unit || 'PCS';
                }
            }
            return next;
        });
    };

    // ===================== FORM VIEW =====================
    if (view === 'form') {
        // filter out 'Fabric' so packaging and accessories are mostly visible, but allow all just in case
        const bomSelectableMaterials = materials.filter(m => m.category !== 'Fabric');

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-secondary rounded-xl border border-border transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">
                            {editingId ? `Edit BOM: ${productName}` : 'New Bill of Materials'}
                        </h1>
                        <p className="text-muted text-sm">Define packaging and accessory recipes per product.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save BOM'}
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
                            <p className="text-[10px] text-orange-500 font-bold">⚠ No products found. Add products first.</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">BOM For</label>
                        <div className="relative group">
                            <select
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                className="h-10 pl-4 pr-10 bg-secondary/50 border border-border rounded-xl outline-none font-bold appearance-none cursor-pointer hover:bg-secondary/80 focus:ring-2 focus:ring-primary/20 transition-all text-sm min-w-[160px]"
                            >
                                <option value="Dozen">1 Dozen (12 pcs)</option>
                                <option value="10 Pcs">10 pcs</option>
                                <option value="8 Pcs">8 pcs</option>
                                <option value="6 Pcs">6 pcs</option>
                                <option value="Pcs">1 Piece</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted transition-transform group-hover:translate-y-[-40%]">
                                <Plus className="w-3.5 h-3.5 rotate-45" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Materials Table Area */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
                        <h3 className="font-bold text-sm">Required Materials</h3>
                        <button onClick={addMaterialRow} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="px-5 py-3 text-[10px] font-black text-muted uppercase tracking-wider w-1/2">Material component</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-muted uppercase tracking-wider w-1/4">Quantity</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-muted uppercase tracking-wider w-1/4">Unit</th>
                                    <th className="px-5 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bomMaterials.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-muted">
                                            <p className="text-sm">No items added to this BOM yet.</p>
                                        </td>
                                    </tr>
                                ) : bomMaterials.map((row, idx) => (
                                    <tr key={idx} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-2">
                                            <select
                                                value={row.name}
                                                onChange={e => updateMaterialRow(idx, 'name', e.target.value)}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-lg outline-none text-sm font-bold appearance-none"
                                            >
                                                <option value="">Select Accessory/Packaging...</option>
                                                {bomSelectableMaterials.map((m: any) => (
                                                    <option key={m._id} value={m.name}>
                                                        {m.name} {m.code ? `(${m.code})` : ''}
                                                    </option>
                                                ))}
                                                {/* Allow retaining existing value if it was removed from masters */}
                                                {!bomSelectableMaterials.find((m: any) => m.name === row.name) && row.name && (
                                                    <option value={row.name}>{row.name} (Legacy)</option>
                                                )}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.001"
                                                value={row.quantity}
                                                onChange={e => updateMaterialRow(idx, 'quantity', e.target.value)}
                                                className="w-full h-9 px-3 bg-background border border-border rounded-lg outline-none text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                                placeholder="0.0"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="h-9 px-3 flex items-center bg-secondary/50 rounded-lg border border-border/50 text-xs font-bold text-muted uppercase">
                                                {row.unit}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button 
                                                onClick={() => removeMaterialRow(idx)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter text-foreground bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
                        Packaging & Accessory BOM
                    </h2>
                    <p className="text-sm text-muted font-medium mt-0.5">Define standard material recipes for finished products.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-95"
                >
                    <Plus className="w-4.5 h-4.5" />
                    Create BOM
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-muted">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Loading BOM records...</p>
                    </div>
                ) : boms.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Edit2 className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No BOMs Defined</h3>
                        <p className="text-muted max-w-sm mt-1">Click "Create BOM" to start defining product packaging requirements.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/30 text-[10px] font-bold uppercase text-muted tracking-wider border-b border-border">
                                    <th className="px-6 py-4">Product Name</th>
                                    <th className="px-6 py-4">BOM Unit</th>
                                    <th className="px-6 py-4">Material Components</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {boms.map((bom) => (
                                    <tr key={bom._id} className="hover:bg-primary/5 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-foreground text-sm uppercase tracking-tight">{bom.productName}</div>
                                            <div className="text-[10px] text-muted font-bold tracking-wider mt-0.5">BOM DEFINITION</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/5 text-indigo-500 rounded-lg border border-indigo-500/10 text-xs font-black whitespace-nowrap">
                                                <Package className="w-3 h-3" />
                                                Per {bom.unit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-2 min-w-[350px]">
                                                {bom.materials?.map((m: any, i: number) => (
                                                    <div key={i} className="px-2.5 py-1.5 bg-secondary/30 hover:bg-secondary/50 border border-border/80 rounded-xl flex items-center gap-2 text-xs transition-all shadow-sm shadow-black/5 group/pill">
                                                        <span className="font-bold text-foreground/80 group-hover/pill:text-foreground transition-colors truncate max-w-[150px]" title={m.name}>
                                                            {m.name}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-black rounded-md text-[10px] tracking-tight whitespace-nowrap">
                                                            {m.quantity} {m.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(!bom.materials || bom.materials.length === 0) && (
                                                    <span className="text-xs text-muted/50 font-medium">No materials defined</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(bom)} className="p-2 text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors tooltip-trigger relative">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(bom._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
