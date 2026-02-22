'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, X, Trash2, Save, FileText, Search, ArrowLeft,
    CheckCircle2, Clock, Scissors
} from 'lucide-react';

type RowData = {
    srNo: number;
    slipNo: string;
    totalSlip: number;
    size: string;
    doz: number;
    pcs: number;
    weight: number;
    wastage: number;
    inRB: number;
    folRB: number;
    totalRowWeight: number;
    remarks: string;
    [key: string]: any;
};

function emptyRow(srNo: number): RowData {
    return {
        srNo,
        slipNo: '',
        totalSlip: 0,
        size: '',
        doz: 0,
        pcs: 0,
        weight: 0,
        wastage: 0,
        inRB: 0,
        folRB: 0,
        totalRowWeight: 0,
        remarks: '',
    };
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
    const [consumptions, setConsumptions] = useState<any[]>([]);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        lotNo: '',
        challanNo: '',
        productName: '',
        gsm: '',
        totalRolls: '',
        quality: '',
        totalWeight: '',
        color: '',
        remarks: '',
    });

    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [rows, setRows] = useState<RowData[]>([emptyRow(1)]);
    const [commonWastage, setCommonWastage] = useState('');
    const [wastageUnit, setWastageUnit] = useState<'kg' | 'g'>('kg');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sheetsRes, partiesRes, colorsRes, matsRes, inwardRes, assignmentsRes, consRes] = await Promise.all([
                fetch('/api/cutting-sheets'),
                fetch('/api/masters/parties?type=DyeingHouse'),
                fetch('/api/masters/colors'),
                fetch('/api/masters/materials'),
                fetch('/api/inward'),
                fetch('/api/cutting/lot-assignments'),
                fetch('/api/consumption'),
            ]);
            const [sheetsData, partiesData, colorsData, matsData, inwardData, assignmentsData, consData] = await Promise.all([
                sheetsRes.json(), partiesRes.json(), colorsRes.json(), matsRes.json(), inwardRes.json(), assignmentsRes.json(), consRes.json()
            ]);

            const clientsRes = await fetch('/api/masters/parties?type=Client');
            const clientsData = await clientsRes.json();

            setSheets(Array.isArray(sheetsData) ? sheetsData : []);
            setParties(Array.isArray(partiesData) ? partiesData : []);
            setClients(Array.isArray(clientsData) ? clientsData : []);
            setColors(Array.isArray(colorsData) ? colorsData : []);
            setMaterials(Array.isArray(matsData) ? matsData : []);
            setConsumptions(Array.isArray(consData) ? consData : []);

            const processedLots = processLotGroups(inwardData, assignmentsData);
            setAvailableLots(processedLots);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const processLotGroups = (inwards: any[], assignments: any[] = []) => {
        const groups: Record<string, any> = {};

        inwards.forEach(inward => {
            const lotKey = inward.lotNo || 'No Lot';
            if (!groups[lotKey]) {
                groups[lotKey] = {
                    lotNo: lotKey,
                    partyName: inward.partyId?.name || 'Internal',
                    items: [],
                    totalWeight: 0,
                    totalRolls: 0,
                    uniqueColors: new Set<string>(),
                    uniqueGsms: new Set<string>(),
                };
            }
            inward.items.forEach((item: any) => {
                const isApproved = item.status === 'Approved';
                const materialName = item.materialId?.name || '';
                const isRib = materialName.toLowerCase().includes('rib') ||
                    (item.materialId?.subType || '').toLowerCase().includes('rib');

                if (isApproved) {
                    groups[lotKey].items.push({ ...item, inwardId: inward._id });
                    groups[lotKey].totalWeight += Number(item.quantity) || 0;

                    // Sum up the actual number of rolls or pieces from the inward items
                    const rollCount = Number(item.rolls) || Number(item.pcs) || 1;
                    groups[lotKey].totalRolls = (groups[lotKey].totalRolls || 0) + rollCount;

                    if (item.color) groups[lotKey].uniqueColors.add(item.color);

                    const gsmVal = Number(item.gsm);
                    if (!isNaN(gsmVal) && gsmVal > 0) {
                        groups[lotKey].uniqueGsms.add(gsmVal.toFixed(1));
                    }

                    if (!isRib && !groups[lotKey].quality && materialName) {
                        groups[lotKey].quality = materialName;
                    }
                }
            });
        });

        Object.keys(groups).forEach(key => {
            const group = groups[key];
            const colorList = Array.from(group.uniqueColors);
            group.color = colorList.length > 0
                ? `${colorList.length} ${colorList.length === 1 ? 'Color' : 'Colors'}`
                : '';

            group.gsm = Array.from(group.uniqueGsms).sort().join(' / ');

            if (!group.quality && group.items.length > 0) {
                group.quality = group.items[0].materialId?.name || '';
            }

            const lotAssignment = assignments.find((a: any) => a.lotNo === key);
            group.assignedProduct = lotAssignment?.productName || '';
        });

        return Object.values(groups).filter(g => g.items.length > 0);
    };

    useEffect(() => { fetchAll(); }, []);

    const recalculateRows = (updatedRows: RowData[]) => {
        let currentSlipStart = 1;
        const coeff = Number(commonWastage) || 0;

        const finalRows = updatedRows.map((row, idx) => {
            const doz = Number(row.doz) || 0;
            const pcs = doz * 12;
            const totalSlip = Number(row.totalSlip) || 0;

            let slipNo = '';
            if (totalSlip > 0) {
                const end = currentSlipStart + totalSlip - 1;
                slipNo = `${currentSlipStart}-${end}`;
                currentSlipStart = end + 1;
            }

            // Auto-calculate wastage if common coefficient is set
            let wastage = Number(row.wastage) || 0;
            if (coeff > 0) {
                wastage = doz * coeff;
                if (wastageUnit === 'g') {
                    wastage = wastage / 1000;
                }
            }

            const prodCons = consumptions.find(c =>
                c.productName.trim().toLowerCase() === form.productName.trim().toLowerCase()
            );
            const variation = prodCons?.variations?.find((v: any) => v.size === row.size);

            let inRB = 0;
            let folRB = 0;

            if (variation) {
                const inRBCons = variation.consumption.find((c: any) =>
                    c.name.toLowerCase().includes('in r/b') || c.name.toLowerCase() === 'rib' || c.name.toLowerCase().includes('in rb')
                );
                const folRBCons = variation.consumption.find((c: any) =>
                    c.name.toLowerCase().includes('fol r/b') || c.name.toLowerCase().includes('fol rb')
                );

                inRB = (Number(inRBCons?.value) || 0) * doz;
                folRB = (Number(folRBCons?.value) || 0) * doz;
            }

            const weight = Number(row.weight) || 0;
            const totalRowWeight = weight + wastage + inRB + folRB;

            return {
                ...row,
                srNo: idx + 1,
                slipNo,
                pcs,
                wastage: Number(wastage.toFixed(3)),
                inRB: Number(inRB.toFixed(3)),
                folRB: Number(folRB.toFixed(3)),
                totalRowWeight: Number(totalRowWeight.toFixed(3))
            };
        });
        setRows(finalRows);
    };

    const updateRow = (idx: number, field: string, val: any) => {
        const next = [...rows];
        next[idx] = { ...next[idx], [field]: val };
        recalculateRows(next);
    };

    const addRow = () => {
        const next = [...rows, emptyRow(rows.length + 1)];
        recalculateRows(next);
    };

    const removeRow = (idx: number) => {
        const next = rows.filter((_, i) => i !== idx);
        recalculateRows(next);
    };

    const applyCommonWastage = (val: string, unit: 'kg' | 'g' = wastageUnit) => {
        // We set the state and then call recalculateRows which now uses this state
        setCommonWastage(val);
        setWastageUnit(unit);
        // Recalculate will use the new commonWastage/Unit values
        // Note: state updates are async, so we pass them dummy-style or use a temp rows list
        const coeff = Number(val) || 0;
        const next = rows.map(r => {
            let w = Number(r.doz) * coeff;
            if (unit === 'g') w = w / 1000;
            return { ...r, wastage: Number(w.toFixed(3)) };
        });
        recalculateRows(next);
    };

    const grandTotals = rows.reduce(
        (acc, row) => ({
            totalDozens: acc.totalDozens + (Number(row.doz) || 0),
            totalPieces: acc.totalPieces + (Number(row.pcs) || 0),
            fabricUsedKg: acc.fabricUsedKg + (Number(row.totalRowWeight) || 0),
            wastageKg: acc.wastageKg + (Number(row.wastage) || 0),
        }),
        { totalDozens: 0, totalPieces: 0, fabricUsedKg: 0, wastageKg: 0 }
    );

    const handleSubmit = async (status: 'Draft' | 'Submitted') => {
        if (!form.lotNo) return alert('Lot No. is required');
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
            lotNo: '', challanNo: '',
            productName: '', gsm: '', totalRolls: '', quality: '', totalWeight: '', color: '',
            remarks: '',
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

    if (view === 'form') {
        return (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header Actions */}
                <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                    <button
                        onClick={() => { setView('list'); resetForm(); }}
                        className="p-2.5 hover:bg-secondary rounded-xl border border-border transition-all hover:scale-105"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Scissors className="w-6 h-6 text-primary" />
                            New Cutting Order
                        </h1>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-wider">Production Planning / Cutting Sheet</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSubmit('Draft')}
                            disabled={saving}
                            className="px-5 py-2.5 border border-border bg-background rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-secondary transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Draft
                        </button>
                        <button
                            onClick={() => handleSubmit('Submitted')}
                            disabled={saving}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/30 hover:opacity-90 transition-all hover:-translate-y-0.5"
                        >
                            <FileText className="w-4 h-4" />
                            {saving ? 'Processing...' : 'Submit Order'}
                        </button>
                    </div>
                </div>

                {/* Section 1: Header Info */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-6 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-primary/30" />
                        Master Information
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Date</label>
                            <input
                                suppressHydrationWarning
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full bg-transparent outline-none font-black text-sm"
                            />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Lot No.</label>
                            <select
                                suppressHydrationWarning
                                value={form.lotNo}
                                onChange={e => {
                                    const lot = availableLots.find(l => l.lotNo === e.target.value);
                                    if (lot) {
                                        setForm({
                                            ...form,
                                            lotNo: lot.lotNo,
                                            productName: lot.assignedProduct || '',
                                            gsm: lot.gsm || '',
                                            totalRolls: String(lot.totalRolls || ''),
                                            quality: lot.quality || '',
                                            totalWeight: String(lot.totalWeight || ''),
                                            color: lot.color || '',
                                        });
                                    } else {
                                        setForm({ ...form, lotNo: e.target.value });
                                    }
                                }}
                                className="w-full bg-transparent outline-none font-black text-sm cursor-pointer"
                            >
                                <option value="">-- Choose Lot --</option>
                                {availableLots.map(l => <option key={l.lotNo} value={l.lotNo}>{l.lotNo}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Challan No.</label>
                            <input
                                suppressHydrationWarning
                                type="text"
                                value={form.challanNo}
                                onChange={e => setForm({ ...form, challanNo: e.target.value })}
                                placeholder="Enter No."
                                className="w-full bg-transparent outline-none font-black text-sm placeholder:text-muted/30"
                            />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Product Name</label>
                            <input type="text" value={form.productName} readOnly className="w-full bg-transparent outline-none font-black text-sm text-primary" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">GSM Info</label>
                            <input type="text" value={form.gsm} readOnly className="w-full bg-transparent outline-none font-black text-sm text-muted" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Total Rolls</label>
                            <input type="text" value={form.totalRolls} readOnly className="w-full bg-transparent outline-none font-black text-sm text-muted" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Fabric Quality</label>
                            <input type="text" value={form.quality} readOnly className="w-full bg-transparent outline-none font-black text-sm text-muted uppercase" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Total Weight</label>
                            <input type="text" value={form.totalWeight + ' KG'} readOnly className="w-full bg-transparent outline-none font-black text-sm text-muted" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Passed Colors</label>
                            <input type="text" value={form.color} readOnly className="w-full bg-transparent outline-none font-black text-sm text-rose-600 uppercase" />
                        </div>

                        <div className="space-y-1.5 p-3 bg-secondary/5 rounded-xl border border-transparent hover:border-border transition-all">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted/60">Sheet Remarks</label>
                            <input
                                suppressHydrationWarning
                                type="text"
                                value={form.remarks}
                                onChange={e => setForm({ ...form, remarks: e.target.value })}
                                className="w-full bg-transparent outline-none font-medium text-sm"
                                placeholder="..."
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Cutting Table */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Cutting Details</span>
                        </div>
                        <button
                            suppressHydrationWarning
                            onClick={addRow}
                            className="px-4 py-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add New Row
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1300px]">
                            <thead>
                                <tr className="bg-secondary/30 text-[9px] font-black uppercase text-muted tracking-[0.15em] border-b border-border">
                                    <th className="px-4 py-4 text-center w-12">#</th>
                                    <th className="px-4 py-4">Slip No</th>
                                    <th className="px-4 py-4">Total Slip</th>
                                    <th className="px-4 py-4">Size</th>
                                    <th className="px-4 py-4 text-center">Doz</th>
                                    <th className="px-4 py-4 text-center">Pcs</th>
                                    <th className="px-4 py-4 text-center">Weight (KG)</th>
                                    <th className="px-4 py-4 text-center">Wastage</th>
                                    <th className="px-4 py-4 text-center">In R/B</th>
                                    <th className="px-4 py-4 text-center">Fol R/B</th>
                                    <th className="px-4 py-4 text-center bg-primary/5 text-primary">Total WT</th>
                                    <th className="px-4 py-4 text-right w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => {
                                    const availableSizes = consumptions
                                        .find(c => c.productName.trim().toLowerCase() === form.productName.trim().toLowerCase())
                                        ?.variations?.map((v: any) => v.size) || [];

                                    return (
                                        <tr key={idx} className="border-b border-border hover:bg-secondary/5 transition-all group">
                                            <td className="px-4 py-4 text-center text-[11px] font-black text-muted/50">{idx + 1}</td>

                                            <td className="px-2 py-3">
                                                <input type="text" value={row.slipNo} readOnly className="w-full h-9 px-3 bg-secondary/20 border-0 rounded-lg text-xs font-black text-center text-primary" />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    value={row.totalSlip || ''}
                                                    onChange={e => updateRow(idx, 'totalSlip', Number(e.target.value))}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </td>

                                            <td className="px-2 py-3">
                                                <select
                                                    value={row.size}
                                                    onChange={e => updateRow(idx, 'size', e.target.value)}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                                >
                                                    <option value="">-- Size --</option>
                                                    {availableSizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>

                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    value={row.doz || ''}
                                                    onChange={e => updateRow(idx, 'doz', Number(e.target.value))}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input type="number" value={row.pcs || ''} readOnly className="w-full h-9 px-3 bg-secondary/20 border-0 rounded-lg text-xs font-black text-center text-muted" />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    value={row.weight || ''}
                                                    onChange={e => updateRow(idx, 'weight', Number(e.target.value))}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={row.wastage || ''}
                                                    onChange={e => updateRow(idx, 'wastage', Number(e.target.value))}
                                                    className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input type="number" value={row.inRB || ''} readOnly className="w-full h-9 px-3 bg-secondary/20 border-0 rounded-lg text-xs font-bold text-center text-muted" />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input type="number" value={row.folRB || ''} readOnly className="w-full h-9 px-3 bg-secondary/20 border-0 rounded-lg text-xs font-bold text-center text-muted" />
                                            </td>

                                            <td className="px-2 py-3">
                                                <input type="number" value={row.totalRowWeight || ''} readOnly className="w-full h-9 px-3 bg-primary/10 border-0 rounded-lg text-[13px] font-black text-primary text-center" />
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => removeRow(idx)}
                                                    className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-20">
                                <tr className="bg-secondary/90 backdrop-blur-sm font-black text-xs border-t border-border">
                                    <td className="px-4 py-4 text-center border-r border-border text-muted font-bold" colSpan={4}>
                                        TOTAL SUMMARY
                                    </td>
                                    <td className="px-2 py-4 text-center border-r border-border text-primary font-black text-base">
                                        {grandTotals.totalDozens}
                                    </td>
                                    <td className="px-2 py-4 text-center border-r border-border text-foreground font-black text-base">
                                        {grandTotals.totalPieces}
                                    </td>
                                    <td colSpan={4} className="border-r border-border" />
                                    <td className="px-2 py-4 text-center border-r border-border text-primary font-black text-lg">
                                        {grandTotals.fabricUsedKg.toFixed(2)} KG
                                    </td>
                                    <td colSpan={1} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary/10 border-t border-border">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-muted/60 tracking-wider">Common Wastage Coeff</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white border border-primary/20 rounded-lg overflow-hidden shadow-sm">
                                        <input
                                            type="number"
                                            step="any"
                                            value={commonWastage}
                                            onChange={e => applyCommonWastage(e.target.value)}
                                            className="w-24 h-9 px-3 text-xs font-black outline-none"
                                            placeholder="Value"
                                        />
                                        <div className="flex border-l border-primary/10 bg-secondary/5">
                                            {(['kg', 'g'] as const).map((u) => (
                                                <button
                                                    key={u}
                                                    onClick={() => {
                                                        setWastageUnit(u);
                                                        applyCommonWastage(commonWastage, u);
                                                    }}
                                                    className={`px-3 h-9 text-[10px] font-black uppercase transition-all ${wastageUnit === u ? 'bg-primary text-white' : 'text-muted hover:bg-secondary'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-primary italic ml-2">Applies (Doz × Coeff) to all rows</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={addRow}
                            className="px-6 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> Add New Row
                        </button>
                    </div>
                </div>

                {/* Section 3: Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Dozens', value: grandTotals.totalDozens, color: 'primary', suffix: '' },
                        { label: 'Total Pieces', value: grandTotals.totalPieces, color: 'blue', suffix: '' },
                        { label: 'Fabric Used', value: grandTotals.fabricUsedKg.toFixed(2), color: 'green', suffix: ' KG' },
                        { label: 'Wastage', value: grandTotals.wastageKg.toFixed(2), color: 'orange', suffix: ' KG' },
                        { label: 'Remaining', value: (Number(form.totalWeight) - grandTotals.fabricUsedKg).toFixed(2), color: 'red', suffix: ' KG' },
                    ].map(card => (
                        <div key={card.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center relative overflow-hidden group hover:border-primary/50 transition-all">
                            <div className={`absolute top-0 left-0 w-full h-1 ${card.color === 'primary' ? 'bg-primary' : card.color === 'blue' ? 'bg-blue-500' : card.color === 'green' ? 'bg-emerald-500' : card.color === 'orange' ? 'bg-orange-500' : 'bg-rose-500'}`} />
                            <div className={`text-2xl font-black ${card.color === 'primary' ? 'text-primary' : card.color === 'blue' ? 'text-blue-500' : card.color === 'green' ? 'text-emerald-500' : card.color === 'orange' ? 'text-orange-500' : 'text-rose-500'}`}>
                                {card.value}{card.suffix}
                            </div>
                            <div className="text-[9px] font-black uppercase text-muted/60 tracking-widest mt-1.5">{card.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* List View Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Scissors className="w-6 h-6 text-primary" />
                        </div>
                        Cutting Sheets
                    </h1>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Management Console / Production History</p>
                </div>
                <button
                    onClick={() => { setView('form'); resetForm(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    New Order
                </button>
            </div>

            {/* List Content */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border bg-secondary/5 flex items-center justify-between gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
                        <input
                            type="text"
                            placeholder="SEARCH LOT, PRODUCT, SHEET..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/30"
                        />
                    </div>
                    <div className="px-3 py-1.5 bg-secondary/20 rounded-lg text-[10px] font-black text-muted uppercase tracking-widest border border-border">
                        {filtered.length} RECORDS FOUND
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/30 text-[9px] font-black uppercase text-muted tracking-widest border-b border-border">
                                <th className="px-6 py-5">Sheet Details</th>
                                <th className="px-6 py-5">Production Info</th>
                                <th className="px-6 py-5">Lot & Colors</th>
                                <th className="px-6 py-5 text-center">Totals</th>
                                <th className="px-6 py-5 text-center">Fabric (KG)</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="p-20 text-center"><Clock className="w-8 h-8 text-primary animate-spin mx-auto mb-4 opacity-20" /><div className="text-[10px] font-black text-muted tracking-widest uppercase">Fetching Records...</div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-24 text-center">
                                        <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
                                            <Scissors className="w-8 h-8 text-muted/30" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-wider">No Records Found</h3>
                                        <p className="text-muted text-[11px] font-medium mt-2">Initialize your production line by creating a new cutting sheet.</p>
                                    </td>
                                </tr>
                            ) : filtered.map(sheet => (
                                <tr key={sheet._id} className="hover:bg-secondary/5 transition-all group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary">
                                    <td className="px-6 py-5">
                                        <div className="font-black text-primary text-sm tracking-tight">{sheet.sheetNo}</div>
                                        <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-wider">{new Date(sheet.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-black text-foreground text-xs uppercase tracking-tight">{sheet.productName}</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[9px] font-black bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded leading-none uppercase">GSM {sheet.gsm}</span>
                                            {sheet.quality && <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded leading-none uppercase">{sheet.quality}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-black text-foreground tracking-tighter">LOT #{sheet.lotNo || 'N/A'}</div>
                                        <div className="text-[9px] text-muted font-bold uppercase truncate max-w-[150px] mt-1.5 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {sheet.color}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="font-black text-foreground text-xs uppercase">{sheet.grandTotalDozens} DOZ</div>
                                        <div className="text-[10px] font-bold text-muted mt-1">{sheet.grandTotalPieces} PCS</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="font-black text-primary text-sm tracking-tight">{sheet.totalFabricUsedKg?.toFixed(2)}</div>
                                        <div className="text-[9px] font-bold text-muted mt-1 tracking-widest uppercase">KG USED</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] ${sheet.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                            sheet.status === 'Submitted' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                                'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                                            }`}>
                                            {sheet.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {sheet.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right w-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(sheet._id); }}
                                            className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all text-muted/30 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
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
