'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, X, Trash2, Save, FileText, Search, ArrowLeft,
    CheckCircle2, Clock, Scissors
} from 'lucide-react';

const SIZES = [
    { key: 's75', label: '75' },
    { key: 's80', label: '80' },
    { key: 's85', label: '85' },
    { key: 's90', label: '90' },
    { key: 's95', label: '95' },
    { key: 's100', label: '100' },
    { key: 's105', label: '105' },
    { key: 's110', label: '110' },
];

type RowData = {
    srNo: number; color: string; materialName: string; lotNo: string;
    s75: number; s80: number; s85: number; s90: number;
    s95: number; s100: number; s105: number; s110: number;
    totalDozens: number; totalPieces: number;
    fabricUsedKg: number; wastageKg: number; rippedKg: number;
    remarks: string;
    [key: string]: any;
};

function emptyRow(srNo: number): RowData {
    return {
        srNo,
        color: '',
        materialName: '',
        lotNo: '',
        s75: 0, s80: 0, s85: 0, s90: 0, s95: 0, s100: 0, s105: 0, s110: 0,
        totalDozens: 0,
        totalPieces: 0,
        fabricUsedKg: 0,
        wastageKg: 0,
        rippedKg: 0,
        remarks: '',
    };
}

function calcRow(row: RowData): RowData {
    const totalDozens = SIZES.reduce((sum, s) => sum + (Number(row[s.key]) || 0), 0);
    return { ...row, totalDozens, totalPieces: totalDozens * 12 };
}

export default function CuttingPage() {
    const [sheets, setSheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [parties, setParties] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        partyId: '',
        clientId: '',
        lotNo: '',
        inwardChallanNo: '',
        productName: '',
        style: '',
        remarks: '',
    });

    const [rows, setRows] = useState<RowData[]>([emptyRow(1)]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sheetsRes, partiesRes, colorsRes, matsRes] = await Promise.all([
                fetch('/api/cutting-sheets'),
                fetch('/api/masters/parties?type=DyeingHouse'),
                fetch('/api/masters/colors'),
                fetch('/api/masters/materials'),
            ]);
            const [sheetsData, partiesData, colorsData, matsData] = await Promise.all([
                sheetsRes.json(), partiesRes.json(), colorsRes.json(), matsRes.json()
            ]);
            const clientsRes = await fetch('/api/masters/parties?type=Client');
            const clientsData = await clientsRes.json();

            setSheets(Array.isArray(sheetsData) ? sheetsData : []);
            setParties(Array.isArray(partiesData) ? partiesData : []);
            setClients(Array.isArray(clientsData) ? clientsData : []);
            setColors(Array.isArray(colorsData) ? colorsData : []);
            setMaterials(Array.isArray(matsData) ? matsData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const updateRow = (idx: number, field: string, val: any) => {
        setRows(prev => {
            const next = [...prev];
            next[idx] = calcRow({ ...next[idx], [field]: val });
            return next;
        });
    };

    const addRow = () => {
        setRows(prev => [...prev, emptyRow(prev.length + 1)]);
    };

    const removeRow = (idx: number) => {
        setRows(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, srNo: i + 1 })));
    };

    const grandTotals = rows.reduce(
        (acc, row) => ({
            totalDozens: acc.totalDozens + row.totalDozens,
            totalPieces: acc.totalPieces + row.totalPieces,
            fabricUsedKg: acc.fabricUsedKg + (Number(row.fabricUsedKg) || 0),
            wastageKg: acc.wastageKg + (Number(row.wastageKg) || 0),
            rippedKg: acc.rippedKg + (Number(row.rippedKg) || 0),
        }),
        { totalDozens: 0, totalPieces: 0, fabricUsedKg: 0, wastageKg: 0, rippedKg: 0 }
    );

    const sizeTotals = SIZES.reduce((acc, s) => ({
        ...acc,
        [s.key]: rows.reduce((sum, row) => sum + (Number(row[s.key]) || 0), 0)
    }), {} as Record<string, number>);

    const handleSubmit = async (status: 'Draft' | 'Submitted') => {
        if (!form.productName.trim()) return alert('Product Name is required');
        if (rows.length === 0) return alert('Add at least one row');

        setSaving(true);
        try {
            const payload = {
                ...form,
                rows,
                status,
            };
            const res = await fetch('/api/cutting-sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                await fetchAll();
                setView('list');
                resetForm();
            } else {
                const e = await res.json();
                alert(e.error || 'Save failed');
            }
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            date: new Date().toISOString().split('T')[0],
            partyId: '', clientId: '', lotNo: '', inwardChallanNo: '',
            productName: '', style: '', remarks: '',
        });
        setRows([emptyRow(1)]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this cutting sheet?')) return;
        await fetch(`/api/cutting-sheets?id=${id}`, { method: 'DELETE' });
        fetchAll();
    };

    const filtered = sheets.filter(s =>
        s.sheetNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.partyId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─────────────────────────── FORM VIEW ───────────────────────────
    if (view === 'form') {
        return (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setView('list'); resetForm(); }}
                        className="p-2 hover:bg-secondary rounded-xl border border-border transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Scissors className="w-6 h-6 text-primary" />
                            New Cutting Sheet
                        </h1>
                        <p className="text-muted text-sm">Fill in the cutting order details. One sheet per production run.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSubmit('Draft')}
                            disabled={saving}
                            className="px-4 py-2.5 border border-border bg-card rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-secondary transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSubmit('Submitted')}
                            disabled={saving}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
                        >
                            <FileText className="w-4 h-4" />
                            {saving ? 'Submitting...' : 'Submit to LUX'}
                        </button>
                    </div>
                </div>

                {/* ── Section 1: Header Info ── */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <h2 className="text-xs font-black uppercase text-muted/70 tracking-widest mb-4">Sheet Header</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Date — entered ONCE */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Dyeing House / Party</label>
                            <select
                                value={form.partyId}
                                onChange={e => setForm({ ...form, partyId: e.target.value })}
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none font-bold text-sm appearance-none"
                            >
                                <option value="">-- Select Party --</option>
                                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Client (LUX / Rupa)</label>
                            <select
                                value={form.clientId}
                                onChange={e => setForm({ ...form, clientId: e.target.value })}
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none font-bold text-sm appearance-none"
                            >
                                <option value="">-- Select Client --</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Lot No.</label>
                            <input
                                type="text"
                                value={form.lotNo}
                                onChange={e => setForm({ ...form, lotNo: e.target.value })}
                                placeholder="e.g. L-2025-01"
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Inward Challan No.</label>
                            <input
                                type="text"
                                value={form.inwardChallanNo}
                                onChange={e => setForm({ ...form, inwardChallanNo: e.target.value })}
                                placeholder="Challan No."
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Product Name</label>
                            <input
                                type="text"
                                value={form.productName}
                                onChange={e => setForm({ ...form, productName: e.target.value })}
                                placeholder="e.g. Vest, T-Shirt"
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Style / Code</label>
                            <input
                                type="text"
                                value={form.style}
                                onChange={e => setForm({ ...form, style: e.target.value })}
                                placeholder="Optional style code"
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-wider text-muted/70">Remarks</label>
                            <input
                                type="text"
                                value={form.remarks}
                                onChange={e => setForm({ ...form, remarks: e.target.value })}
                                placeholder="Optional notes..."
                                className="w-full h-10 px-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Cutting Table (LUX Style) ── */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/10">
                        <span className="text-xs font-black uppercase tracking-widest text-muted">Cutting Details (Size-wise in Dozens)</span>
                        <button
                            onClick={addRow}
                            className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-lg hover:bg-primary/20 border border-primary/20 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                    </div>

                    <div className="overflow-auto max-h-[50vh]">
                        <table className="w-full border-collapse text-xs">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-secondary text-[10px] font-black uppercase tracking-wider text-muted">
                                    <th className="sticky left-0 z-30 bg-secondary px-3 py-3 text-center border-b border-r border-border w-10">#</th>
                                    <th className="bg-secondary px-3 py-3 text-left border-b border-r border-border min-w-[130px]">Color</th>
                                    <th className="bg-secondary px-3 py-3 text-left border-b border-r border-border min-w-[120px]">Material</th>
                                    <th className="bg-secondary px-3 py-3 text-left border-b border-r border-border min-w-[80px]">Lot No.</th>
                                    {SIZES.map(s => (
                                        <th key={s.key} className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[55px]">
                                            {s.label}
                                        </th>
                                    ))}
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[60px] text-primary">Total Doz</th>
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[60px] text-primary">Total Pcs</th>
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[70px]">Fabric (KG)</th>
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[65px]">Waste (KG)</th>
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-r border-border min-w-[65px]">Ripped (KG)</th>
                                    <th className="bg-secondary px-3 py-3 text-left border-b border-r border-border min-w-[120px]">Remarks</th>
                                    <th className="bg-secondary px-3 py-3 text-center border-b border-border w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-primary/5 transition-colors border-b border-border/50">
                                        {/* SR */}
                                        <td className="sticky left-0 z-10 bg-card group-hover:bg-primary/5 transition-colors px-3 py-2 text-center font-black text-muted border-r border-border text-xs">
                                            {row.srNo}
                                        </td>
                                        {/* Color */}
                                        <td className="px-2 py-1.5 border-r border-border/50">
                                            <select
                                                value={row.color}
                                                onChange={e => updateRow(idx, 'color', e.target.value)}
                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 font-bold text-xs appearance-none"
                                            >
                                                <option value="">-- Color --</option>
                                                {colors.map(c => (
                                                    <option key={c._id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {/* Material */}
                                        <td className="px-2 py-1.5 border-r border-border/50">
                                            <select
                                                value={row.materialName}
                                                onChange={e => updateRow(idx, 'materialName', e.target.value)}
                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 font-bold text-xs appearance-none"
                                            >
                                                <option value="">-- Material --</option>
                                                {materials.map(m => (
                                                    <option key={m._id} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {/* Lot No */}
                                        <td className="px-2 py-1.5 border-r border-border/50">
                                            <input
                                                type="text"
                                                value={row.lotNo}
                                                onChange={e => updateRow(idx, 'lotNo', e.target.value)}
                                                placeholder="Lot"
                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 text-xs font-bold text-center"
                                            />
                                        </td>
                                        {/* Size columns */}
                                        {SIZES.map(s => (
                                            <td key={s.key} className="px-1.5 py-1.5 border-r border-border/50">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={row[s.key] || ''}
                                                    onChange={e => updateRow(idx, s.key, Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full h-8 text-center bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 focus:bg-primary/5 font-bold text-xs hover:bg-secondary/30 transition-colors"
                                                />
                                            </td>
                                        ))}
                                        {/* Total Dozens */}
                                        <td className="px-2 py-1.5 text-center border-r border-border/50 bg-primary/5">
                                            <span className="font-black text-primary text-sm">{row.totalDozens}</span>
                                        </td>
                                        {/* Total Pieces */}
                                        <td className="px-2 py-1.5 text-center border-r border-border/50 bg-primary/5">
                                            <span className="font-black text-primary text-sm">{row.totalPieces}</span>
                                        </td>
                                        {/* Fabric KG */}
                                        <td className="px-1.5 py-1.5 border-r border-border/50">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={row.fabricUsedKg || ''}
                                                onChange={e => updateRow(idx, 'fabricUsedKg', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-8 text-center bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 text-xs font-bold"
                                            />
                                        </td>
                                        {/* Wastage KG */}
                                        <td className="px-1.5 py-1.5 border-r border-border/50">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={row.wastageKg || ''}
                                                onChange={e => updateRow(idx, 'wastageKg', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-8 text-center bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 text-xs font-bold"
                                            />
                                        </td>
                                        {/* Ripped KG */}
                                        <td className="px-1.5 py-1.5 border-r border-border/50">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={row.rippedKg || ''}
                                                onChange={e => updateRow(idx, 'rippedKg', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-8 text-center bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 text-xs font-bold"
                                            />
                                        </td>
                                        {/* Row Remarks */}
                                        <td className="px-1.5 py-1.5 border-r border-border/50">
                                            <input
                                                type="text"
                                                value={row.remarks}
                                                onChange={e => updateRow(idx, 'remarks', e.target.value)}
                                                placeholder="Note..."
                                                className="w-full h-8 px-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20 text-xs"
                                            />
                                        </td>
                                        {/* Delete row */}
                                        <td className="px-2 py-1.5 text-center">
                                            <button
                                                onClick={() => removeRow(idx)}
                                                disabled={rows.length === 1}
                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-muted disabled:opacity-0"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Grand Total Footer Row */}
                            <tfoot className="sticky bottom-0 z-20">
                                <tr className="bg-secondary font-black text-xs border-t-2 border-border">
                                    <td className="sticky left-0 bg-secondary px-3 py-3 text-center border-r border-border text-muted" colSpan={4}>
                                        GRAND TOTAL
                                    </td>
                                    {SIZES.map(s => (
                                        <td key={s.key} className="px-2 py-3 text-center border-r border-border text-primary">
                                            {sizeTotals[s.key] || 0}
                                        </td>
                                    ))}
                                    <td className="px-2 py-3 text-center border-r border-border text-primary text-base">
                                        {grandTotals.totalDozens}
                                    </td>
                                    <td className="px-2 py-3 text-center border-r border-border text-primary text-base">
                                        {grandTotals.totalPieces}
                                    </td>
                                    <td className="px-2 py-3 text-center border-r border-border">
                                        {grandTotals.fabricUsedKg.toFixed(2)}
                                    </td>
                                    <td className="px-2 py-3 text-center border-r border-border text-orange-600">
                                        {grandTotals.wastageKg.toFixed(2)}
                                    </td>
                                    <td className="px-2 py-3 text-center border-r border-border text-red-600">
                                        {grandTotals.rippedKg.toFixed(2)}
                                    </td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Dozens', value: grandTotals.totalDozens, color: 'primary' },
                        { label: 'Total Pieces', value: grandTotals.totalPieces, color: 'primary' },
                        { label: 'Fabric Used (KG)', value: grandTotals.fabricUsedKg.toFixed(2), color: 'blue' },
                        { label: 'Wastage (KG)', value: grandTotals.wastageKg.toFixed(2), color: 'orange' },
                        { label: 'Ripped (KG)', value: grandTotals.rippedKg.toFixed(2), color: 'red' },
                    ].map(card => (
                        <div key={card.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
                            <div className={`text-2xl font-black ${card.color === 'primary' ? 'text-primary' : card.color === 'orange' ? 'text-orange-500' : card.color === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
                                {card.value}
                            </div>
                            <div className="text-[10px] font-black uppercase text-muted/70 tracking-wider mt-1">{card.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ─────────────────────────── LIST VIEW ───────────────────────────
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Scissors className="w-6 h-6 text-primary" />
                        Cutting Sheets
                    </h1>
                    <p className="text-muted text-sm mt-1">Manage size-wise cutting orders for LUX / Rupa production.</p>
                </div>
                <button
                    onClick={() => setView('form')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    New Cutting Sheet
                </button>
            </div>

            {/* Search */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Search sheets, product, party..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <span className="text-xs text-muted">{filtered.length} sheets</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-[10px] font-black uppercase text-muted tracking-wider border-b border-border">
                                <th className="px-6 py-4">Sheet No.</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Party</th>
                                <th className="px-6 py-4">Lot No.</th>
                                <th className="px-6 py-4 text-center">Total Doz</th>
                                <th className="px-6 py-4 text-center">Total Pcs</th>
                                <th className="px-6 py-4 text-center">Fabric (KG)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={10} className="p-10 text-center text-muted">Loading sheets...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-20 text-center">
                                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Scissors className="w-8 h-8 text-muted" />
                                        </div>
                                        <h3 className="text-lg font-semibold">No Cutting Sheets</h3>
                                        <p className="text-muted text-sm mt-1">Click "New Cutting Sheet" to create your first one.</p>
                                    </td>
                                </tr>
                            ) : filtered.map(sheet => (
                                <tr key={sheet._id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-primary text-sm">{sheet.sheetNo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted font-medium">
                                        {new Date(sheet.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-foreground">{sheet.productName}</div>
                                        {sheet.style && <div className="text-[10px] text-muted">{sheet.style}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold">{sheet.partyId?.name || '—'}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-muted">{sheet.lotNo || '—'}</td>
                                    <td className="px-6 py-4 text-center font-black text-primary">{sheet.grandTotalDozens}</td>
                                    <td className="px-6 py-4 text-center font-bold">{sheet.grandTotalPieces}</td>
                                    <td className="px-6 py-4 text-center text-sm font-bold">{sheet.totalFabricUsedKg?.toFixed(2)} KG</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${sheet.status === 'Approved' ? 'bg-green-500/10 text-green-600' :
                                            sheet.status === 'Submitted' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            {sheet.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {sheet.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(sheet._id)}
                                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-muted opacity-0 group-hover:opacity-100"
                                            title="Delete"
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
