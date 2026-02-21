'use client';

import React, { useState, useEffect } from 'react';
import { Scale, X, ArrowRight, AlertCircle, Calculator, Plus, Trash2, CheckCircle, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BulkReweightModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: any[];
    onUpdate: (updates: { inwardId: string; itemId: string; newWeight: number; reweightedBy: string }[]) => Promise<void>;
    initialState?: any;
    onStateChange?: (state: any) => void;
}

export const BulkReweightModal: React.FC<BulkReweightModalProps> = ({ isOpen, onClose, selectedItems, onUpdate, initialState, onStateChange }) => {
    const [totalWeight, setTotalWeight] = useState<string>(initialState?.totalWeight ?? '');
    const [distributionType, setDistributionType] = useState<'equal' | 'proportional' | 'weight'>(initialState?.distributionType ?? 'equal');
    const [adjustmentMode, setAdjustmentMode] = useState<'distribute' | 'adjust'>(initialState?.adjustmentMode ?? 'distribute');
    const [filterDia, setFilterDia] = useState<string>(initialState?.filterDia ?? 'all');
    const [filterColor, setFilterColor] = useState<string>(initialState?.filterColor ?? 'all');
    const [distAction, setDistAction] = useState<'replace' | 'offset'>(initialState?.distAction ?? 'offset');
    const [reweightedBy, setReweightedBy] = useState<string>(initialState?.reweightedBy ?? '');

    // Multi-rule state
    const [adjustmentRules, setAdjustmentRules] = useState<Array<{
        id: string;
        dia: string;
        color: string;
        value: string;
        distType: 'per_item' | 'total_equal' | 'total_pcs' | 'total_weight';
    }>>(initialState?.adjustmentRules ?? [
        { id: Math.random().toString(), dia: 'all', color: 'all', value: '', distType: 'per_item' }
    ]);

    const [previews, setPreviews] = useState<any[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // Persist state changes to parent
    useEffect(() => {
        if (onStateChange) {
            onStateChange({
                totalWeight,
                distributionType,
                adjustmentMode,
                filterDia,
                filterColor,
                distAction,
                reweightedBy,
                adjustmentRules
            });
        }
    }, [totalWeight, distributionType, adjustmentMode, filterDia, filterColor, distAction, reweightedBy, adjustmentRules, onStateChange]);

    // Get unique diameters and colors for filtering
    const uniqueDias = Array.from(new Set(selectedItems.map(i => i.diameter?.toString()))).filter(Boolean).sort();
    const uniqueColors = Array.from(new Set(selectedItems.map(i => i.color))).filter(Boolean).sort();

    useEffect(() => {
        if (!selectedItems || selectedItems.length === 0) {
            setPreviews([]);
            return;
        }

        let newPreviews = [];

        if (adjustmentMode === 'distribute') {
            const filtered = selectedItems.filter(item => {
                const matchDia = filterDia === 'all' || item.diameter?.toString() === filterDia;
                const matchColor = filterColor === 'all' || item.color === filterColor;
                return matchDia && matchColor;
            });

            const val = Number(totalWeight);
            if (filtered.length === 0 || totalWeight === '' || isNaN(val)) {
                setPreviews(selectedItems.map(item => ({ ...item, newWeight: Number(item.quantity).toFixed(2), changed: false })));
                return;
            }

            // Calculation Basis
            let totalBasisPcs = 0;
            let totalBasisWeight = 0;

            if (distributionType === 'proportional') {
                totalBasisPcs = filtered.reduce((acc, item) => acc + (Number(item.pcs) || 0), 0);
            } else if (distributionType === 'weight') {
                totalBasisWeight = filtered.reduce((acc, item) => acc + Number(item.quantity), 0);
            }

            let distributedSoFar = 0;
            const targetIds = new Set(filtered.map(f => f._id || f.id));

            newPreviews = selectedItems.map(item => {
                const itemId = item._id || item.id;
                if (!targetIds.has(itemId)) {
                    return { ...item, newWeight: Number(item.quantity).toFixed(2), changed: false };
                }

                const filterIdx = filtered.findIndex(f => (f._id || f.id) === itemId);
                let finalWeight;

                if (distAction === 'offset') {
                    // Logic for OFFSET (+/-): Split the ADJUSTMENT value
                    let itemsShare;
                    if (filterIdx === filtered.length - 1) {
                        itemsShare = val - distributedSoFar;
                    } else {
                        if (distributionType === 'equal') {
                            itemsShare = val / filtered.length;
                        } else if (distributionType === 'proportional') {
                            const itemPcs = Number(item.pcs) || 0;
                            itemsShare = totalBasisPcs > 0 ? (itemPcs / totalBasisPcs) * val : (val / filtered.length);
                        } else {
                            const itemQty = Number(item.quantity);
                            itemsShare = totalBasisWeight > 0 ? (itemQty / totalBasisWeight) * val : (val / filtered.length);
                        }
                        itemsShare = Number(itemsShare.toFixed(2));
                        distributedSoFar += itemsShare;
                    }
                    finalWeight = Number(item.quantity) + itemsShare;
                } else {
                    // Logic for REPLACE (Fixed Total): Split the TARGET value
                    if (filterIdx === filtered.length - 1) {
                        finalWeight = val - distributedSoFar;
                    } else {
                        if (distributionType === 'equal') {
                            finalWeight = val / filtered.length;
                        } else if (distributionType === 'proportional') {
                            const itemPcs = Number(item.pcs) || 0;
                            finalWeight = totalBasisPcs > 0 ? (itemPcs / totalBasisPcs) * val : (val / filtered.length);
                        } else {
                            const itemQty = Number(item.quantity);
                            finalWeight = totalBasisWeight > 0 ? (itemQty / totalBasisWeight) * val : (val / filtered.length);
                        }
                        finalWeight = Number(finalWeight.toFixed(2));
                        distributedSoFar += finalWeight;
                    }
                }

                return { ...item, newWeight: Math.max(0, finalWeight).toFixed(2), changed: true };
            });
        } else {
            // Adjust +/- Mode with Multi-Rules
            const workingItems = selectedItems.map(item => ({
                ...item,
                tempWeight: Number(item.quantity),
                hasChanged: false
            }));

            adjustmentRules.forEach(rule => {
                const ruleVal = Number(rule.value);
                if (isNaN(ruleVal) || ruleVal === 0) return;

                const matching = workingItems.filter(item => {
                    const matchDia = rule.dia === 'all' || item.diameter?.toString() === rule.dia;
                    const matchColor = rule.color === 'all' || item.color === rule.color;
                    return matchDia && matchColor;
                });

                if (matching.length === 0) return;

                if (rule.distType === 'per_item' || !rule.distType) {
                    matching.forEach(m => {
                        m.tempWeight += ruleVal;
                        m.hasChanged = true;
                    });
                } else {
                    // Distribute adjustment amount
                    let totalBasis = 0;
                    if (rule.distType === 'total_pcs') {
                        totalBasis = matching.reduce((acc, m) => acc + (Number(m.pcs) || 0), 0);
                    } else if (rule.distType === 'total_weight') {
                        totalBasis = matching.reduce((acc, m) => acc + Number(m.quantity), 0);
                    }

                    let allocatedSoFar = 0;
                    matching.forEach((m, idx) => {
                        let share;
                        if (idx === matching.length - 1) {
                            share = ruleVal - allocatedSoFar;
                        } else {
                            if (rule.distType === 'total_equal') {
                                share = ruleVal / matching.length;
                            } else if (rule.distType === 'total_pcs') {
                                const itemPcs = Number(m.pcs) || 0;
                                share = totalBasis > 0 ? (itemPcs / totalBasis) * ruleVal : (ruleVal / matching.length);
                            } else {
                                const itemQty = Number(m.quantity);
                                share = totalBasis > 0 ? (itemQty / totalBasis) * ruleVal : (ruleVal / matching.length);
                            }
                            share = Number(share.toFixed(2));
                            allocatedSoFar += share;
                        }
                        m.tempWeight += share;
                        m.hasChanged = true;
                    });
                }
            });

            newPreviews = workingItems.map(m => ({
                ...m,
                newWeight: Math.max(0, m.tempWeight).toFixed(2),
                changed: m.hasChanged
            }));
        }

        setPreviews(newPreviews);
    }, [totalWeight, distributionType, selectedItems, adjustmentMode, adjustmentRules, filterDia, filterColor, distAction]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!reweightedBy.trim()) {
            alert('Please specify who is reweighting these items.');
            return;
        }

        const updates = previews
            .filter(p => p.changed)
            .map(p => ({
                inwardId: p.inwardId,
                itemId: p._id || p.id,
                newWeight: Number(p.newWeight),
                reweightedBy: reweightedBy,
                color: p.color,
                diameter: p.diameter,
                pcs: p.pcs,
                oldWeight: p.quantity
            }));

        if (updates.length === 0) return;

        setIsUpdating(true);
        try {
            await onUpdate(updates);
            onClose();
        } catch (err) {
            console.error('Bulk reweight failed:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const addRule = () => {
        setAdjustmentRules(prev => [...prev, { id: Math.random().toString(), dia: 'all', color: 'all', value: '', distType: 'per_item' }]);
    };

    const removeRule = (id: string) => {
        setAdjustmentRules(prev => prev.filter(r => r.id !== id));
    };

    const updateRule = (id: string, field: string, value: string) => {
        setAdjustmentRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const downloadReport = async () => {
        const element = document.getElementById('reweight-report-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Reweight_Report_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error('Download error:', err);
        }
    };

    // Calculate Total Weight Change
    const totalOldWeight = selectedItems.reduce((acc, item) => acc + Number(item.quantity), 0);
    const totalNewWeight = previews.reduce((acc, item) => acc + Number(item.newWeight), 0);
    const netCorrection = totalNewWeight - totalOldWeight;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-card w-full max-w-[1000px] max-h-[90vh] rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                            <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Multi-Target Adjustment</h2>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Define correction rules per category</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowReport(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                        >
                            <FileText className="w-4 h-4" /> View Report
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors border border-border">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* TOP STRATEGY BAR */}
                <div className="px-6 py-4 bg-secondary/5 border-b border-border flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-5">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic shrink-0">Select Strategy</span>
                        <div className="flex bg-secondary/30 p-1.5 rounded-xl border border-border w-[380px]">
                            <button onClick={() => setAdjustmentMode('distribute')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${adjustmentMode === 'distribute' ? 'bg-primary text-white shadow-md' : 'text-muted'}`}>Global Target</button>
                            <button onClick={() => setAdjustmentMode('adjust')} className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${adjustmentMode === 'adjust' ? 'bg-primary text-white shadow-md' : 'text-muted'}`}>Rule Based</button>
                        </div>
                    </div>
                    <div className="px-5 py-2.5 bg-primary/5 rounded-xl border border-primary/10 flex-1 max-w-lg">
                        <p className="text-[10px] font-bold text-primary uppercase leading-tight italic text-center">
                            {adjustmentMode === 'distribute'
                                ? "🎯 GLOBAL: Apply a single target or adjustment to all selected items"
                                : "⚖️ RULES: Define specific kg corrections per category (e.g. +2kg for all Maroon)"}
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {/* column 1: FILTERS & META */}
                        <div className="lg:col-span-1 space-y-5">
                            <div className="space-y-4">
                                <span className="text-xs font-black uppercase tracking-widest text-muted italic">1. Global Filter</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={filterDia} onChange={(e) => setFilterDia(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-primary">
                                        <option value="all">ANY DIA</option>
                                        {uniqueDias.map(dia => <option key={dia} value={dia}>{dia}" DIA</option>)}
                                    </select>
                                    <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)} className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-primary">
                                        <option value="all">ANY COLOR</option>
                                        {uniqueColors.map(color => <option key={color} value={color}>{color}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed border-border">
                                <span className="text-xs font-black uppercase tracking-widest text-muted italic">2. Identity</span>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Reweighted By</label>
                                    <input
                                        type="text"
                                        value={reweightedBy}
                                        onChange={(e) => setReweightedBy(e.target.value)}
                                        placeholder="Enter Name..."
                                        className="w-full px-4 py-3 bg-white border-2 border-primary/10 rounded-xl text-xs font-bold placeholder:text-muted/40 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* column 2: CONFIGURATION */}
                        <div className="lg:col-span-2 space-y-5">
                            <span className="text-xs font-black uppercase tracking-widest text-muted italic">3. Weight Details</span>
                            {adjustmentMode === 'distribute' ? (
                                <div className="bg-secondary/10 p-5 rounded-2xl border border-border space-y-6 shadow-inner">
                                    <div className="space-y-4">
                                        <div className="flex bg-white/50 p-1 rounded-xl border border-border">
                                            <button onClick={() => setDistAction('offset')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${distAction === 'offset' ? 'bg-orange-500 text-white shadow-md' : 'text-muted'}`}>ADJUSTMENT (+/-)</button>
                                            <button onClick={() => setDistAction('replace')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${distAction === 'replace' ? 'bg-orange-500 text-white shadow-md' : 'text-muted'}`}>FIXED TOTAL</button>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-primary uppercase tracking-widest">
                                                {distAction === 'offset' ? 'ADD / REDUCE (KG)' : 'TARGET TOTAL (KG)'}
                                            </label>
                                            <div className="relative">
                                                <input type="number" value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} className="w-full px-5 py-4 bg-background border-2 border-primary/20 rounded-xl text-2xl font-black text-primary focus:border-primary outline-none" placeholder="0.00" />
                                                <Scale className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-20" />
                                            </div>
                                            <p className="text-[9px] text-muted font-bold uppercase italic px-1">
                                                {distAction === 'offset' ? 'Positive increases, negative decreases weight.' : 'Sets the exact final sum for selected items.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {['equal', 'proportional', 'weight'].map((type) => (
                                            <button key={type} onClick={() => setDistributionType(type as any)} className={`px-5 py-3 rounded-lg border-2 text-[10px] font-black uppercase transition-all flex items-center justify-between ${distributionType === type ? 'border-primary bg-primary text-white shadow-md' : 'border-border text-muted bg-white'}`}>
                                                {type === 'equal' ? 'Equal Split' : type === 'proportional' ? 'PCS Proportion' : 'Weight Proportion'}
                                                {distributionType === type && <CheckCircle className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1 min-h-[200px]">
                                    {adjustmentRules.map((rule) => (
                                        <div key={rule.id} className="p-2 sm:p-3 bg-white rounded-xl border border-border shadow-sm border-l-[6px] border-l-primary/30 flex items-center gap-2">
                                            <select value={rule.dia} onChange={(e) => updateRule(rule.id, 'dia', e.target.value)} className="flex-1 min-w-0 px-2 py-2 bg-secondary/20 border border-border rounded-lg text-[10px] font-bold focus:outline-none">
                                                <option value="all">Any DIA</option>
                                                {uniqueDias.map(dia => <option key={dia} value={dia}>{dia} DIA</option>)}
                                            </select>
                                            <select value={rule.color} onChange={(e) => updateRule(rule.id, 'color', e.target.value)} className="flex-1 min-w-0 px-2 py-2 bg-secondary/20 border border-border rounded-lg text-[10px] font-bold focus:outline-none">
                                                <option value="all">Any Color</option>
                                                {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <select value={rule.distType} onChange={(e) => updateRule(rule.id, 'distType', e.target.value)} className="flex-[1.4] min-w-0 px-2 py-2 bg-secondary/50 border border-border rounded-lg text-[10px] font-black uppercase italic focus:outline-none">
                                                <option value="per_item">Per Roll</option>
                                                <option value="total_equal">Equal Split</option>
                                                <option value="total_pcs">Split PCS</option>
                                                <option value="total_weight">Split Weight</option>
                                            </select>
                                            <input type="number" value={rule.value} onChange={(e) => updateRule(rule.id, 'value', e.target.value)} placeholder="KG" className="w-16 px-2 py-2 border-2 border-primary/20 rounded-lg text-xs font-black text-center focus:border-primary outline-none" />
                                            {adjustmentRules.length > 1 && <button onClick={() => removeRule(rule.id)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    ))}
                                    <button onClick={addRule} className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted text-xs font-black uppercase bg-white/50 hover:bg-white transition-colors">+ Add Optimization Rule</button>
                                </div>
                            )}
                        </div>

                        {/* column 4: PREVIEW */}
                        <div className="lg:col-span-1 bg-secondary/10 rounded-[1.5rem] border border-border overflow-hidden flex flex-col max-h-[500px]">
                            <div className="p-3 border-b border-border bg-white/50 flex items-center justify-between shrink-0">
                                <span className="text-xs font-black uppercase tracking-widest text-muted">4. Impact Preview</span>
                                <div className="px-2.5 py-1 bg-primary/10 rounded-full">
                                    <span className="text-xs font-black text-primary">{previews.filter(p => p.changed).length}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {previews.map((p, i) => (
                                    <div key={i} className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${p.changed ? 'bg-white border-primary shadow-sm scale-[1.01]' : 'bg-white/40 border-gray-100 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-gray-400 uppercase">{p.color} • {p.diameter}"</div>
                                            <div className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 rounded-sm">{p.pcs || 0} PCS</div>
                                        </div>
                                        <div className="flex items-center justify-between leading-none">
                                            {p.changed ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-muted/30 line-through">{Number(p.quantity).toFixed(2)}</span>
                                                    <ArrowRight className="w-3 h-3 text-primary/40" />
                                                    <span className="text-sm font-black text-primary">{Number(p.newWeight).toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-muted">{Number(p.quantity).toFixed(2)} KG</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM FOOTER BAR - ALWAYS VISIBLE */}
                <div className="p-4 sm:p-6 bg-secondary/5 border-t border-border shrink-0 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-8 z-10">
                        <div className="flex gap-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Base Weight</span>
                                <div className="text-base font-black text-gray-400">{totalOldWeight.toFixed(2)} KG</div>
                            </div>
                            <div className="w-px h-10 bg-border" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Net Correction</span>
                                <div className={`text-xl font-black leading-none ${netCorrection > 0 ? 'text-blue-600' : netCorrection < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {netCorrection > 0 ? '+' : ''}{netCorrection.toFixed(2)} KG
                                </div>
                            </div>
                            <div className="w-px h-10 bg-border" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Final Total</span>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black ${netCorrection > 0 ? 'bg-blue-600 text-white' : netCorrection < 0 ? 'bg-red-600 text-white' : 'bg-gray-100 text-muted'}`}>
                                        {netCorrection > 0 ? 'INC' : netCorrection < 0 ? 'DEC' : 'STABLE'}
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-foreground leading-none">{totalNewWeight.toFixed(2)} KG</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={isUpdating || previews.filter(p => p.changed).length === 0}
                        className="w-full md:w-auto px-14 py-5 bg-primary text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all z-10 flex items-center justify-center gap-4"
                    >
                        {isUpdating ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" /> CONFIRM UPDATE</>}
                    </button>

                    <div className="absolute right-0 top-0 opacity-[0.03] scale-150 rotate-12 -translate-y-4"><Calculator className="w-32 h-32" /></div>
                </div>
            </div>

            {/* REPORT OVERLAY MODAL */}
            {showReport && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                            <h3 className="text-lg font-black uppercase text-gray-800 tracking-tight">Reweight Statement Preview</h3>
                            <button onClick={() => setShowReport(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white custom-scrollbar" id="reweight-report-content">
                            <div className="border-[2px] sm:border-[3px] border-black p-4 sm:p-8 space-y-6 sm:space-y-8 min-w-[500px] sm:min-w-0">
                                <div className="flex items-center justify-between border-b-[3px] border-black pb-6">
                                    <div>
                                        <h1 className="text-3xl font-black uppercase tracking-tighter">REWEIGHT STATEMENT</h1>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-[0.3em] uppercase mt-1">Quality Control Department</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase text-gray-400">Date Generated</div>
                                        <div className="text-sm font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-[11px]">
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Authenticated By</div>
                                        <div className="text-lg font-black uppercase tracking-tight">{reweightedBy || 'Not Specified'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-gray-400 uppercase mb-1">Batch Status</div>
                                        <div className="text-lg font-black text-primary uppercase tracking-tight">Post-Adjustment</div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse border-[2px] border-black min-w-[500px]">
                                        <thead>
                                            <tr className="bg-black text-white text-[9px] font-black uppercase">
                                                <th className="p-3 border-r border-white/20">Description</th>
                                                <th className="p-3 border-r border-white/20">Original (KG)</th>
                                                <th className="p-3 border-r border-white/20">Adjustment</th>
                                                <th className="p-3">Final (KG)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[10px] font-bold uppercase">
                                            {previews.map((p, i) => {
                                                const diff = Number(p.newWeight) - Number(p.quantity);
                                                return (
                                                    <tr key={i} className={`border-b-[2px] border-black ${!p.changed ? 'bg-gray-50/50 opacity-80' : ''}`}>
                                                        <td className="p-3 border-r border-black">
                                                            <div className="flex items-center justify-between">
                                                                <span>{p.color} - {p.diameter}" DIA ({p.pcs} PCS)</span>
                                                                <span className={`text-[7px] px-1 rounded-sm border font-black ${p.changed ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-400'}`}>
                                                                    {p.changed ? 'REWEIGHTED' : 'UNCHANGED'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 border-r border-black">{Number(p.quantity).toFixed(2)}</td>
                                                        <td className={`p-3 border-r border-black ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                            {diff > 0 ? '+' : diff < 0 ? '' : '— '}{diff !== 0 ? diff.toFixed(2) : ''}
                                                        </td>
                                                        <td className={`p-3 font-black ${p.changed ? 'text-gray-900 bg-gray-50' : 'text-gray-400'}`}>{Number(p.newWeight).toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-gray-100 font-black text-[12px]">
                                            <tr>
                                                <td className="p-4 border-r border-black">NET TOTAL</td>
                                                <td className="p-4 border-r border-black">{totalOldWeight.toFixed(2)}</td>
                                                <td className="p-4 border-r border-black">{netCorrection.toFixed(2)}</td>
                                                <td className="p-4 bg-primary text-white">{totalNewWeight.toFixed(2)} KG</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="pt-20 flex justify-between">
                                    <div className="w-48 border-t-2 border-black pt-2 text-[9px] font-black uppercase text-center">In-Charge Signature</div>
                                    <div className="w-48 border-t-2 border-black pt-2 text-[9px] font-black uppercase text-center">Quality Verified</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 shrink-0">
                            <button
                                onClick={downloadReport}
                                className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-xl shadow-black/20"
                            >
                                <Download className="w-5 h-5" /> Download PDF Statement
                            </button>
                            <button
                                onClick={() => setShowReport(false)}
                                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-gray-300 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
