'use client';

import React, { useState, useEffect } from 'react';
import { Ruler, Search, Filter, Loader2, Package, ArrowRight, CheckCircle2, RulerIcon, X, Save } from 'lucide-react';

export default function CuttingSizePage() {
    const [approvedInwards, setApprovedInwards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [cuttingSizeInput, setCuttingSizeInput] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Approved Inwards
            const resInward = await fetch('/api/inward');
            if (resInward.ok) {
                const dataInward = await resInward.json();
                if (Array.isArray(dataInward)) {
                    const flattened = dataInward.flatMap(inward =>
                        inward.items
                            .filter((item: any) => item.status === 'Approved')
                            .map((item: any) => ({
                                ...item,
                                inwardId: inward._id,
                                challanNo: inward.challanNo,
                                partyName: inward.partyId?.name,
                                globalLotNo: inward.lotNo,
                                inwardDate: inward.inwardDate
                            }))
                    );
                    setApprovedInwards(flattened);
                }
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredApproved = approvedInwards.filter(item =>
        (item.lotNo || item.globalLotNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.challanNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (item: any) => {
        setSelectedItem(item);
        setCuttingSizeInput(item.cuttingSize?.toString() || '');
        setIsModalOpen(true);
    };

    const handleUpdateCuttingSize = async () => {
        const size = Number(cuttingSizeInput);
        if (size < 75 || size > 110) {
            alert('Cutting size must be between 75 and 110 cm.');
            return;
        }

        setIsUpdating(true);
        try {
            const res = await fetch(`/api/inward/${selectedItem.inwardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItem._id,
                    cuttingSize: size
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                await fetchData();
            } else {
                alert('Failed to update cutting size');
            }
        } catch (err) {
            console.error('Update error:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Cutting Size - Approved Lots</h1>
                    <p className="text-muted text-sm tracking-tight">Set and manage fabric cutting sizes for approved production lots.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Lot, Color or Challan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all w-72 shadow-sm text-sm"
                        />
                    </div>
                    <div className="ml-2 flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">{approvedInwards.length} Items Ready</span>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                        <p className="text-muted font-medium">Scanning for approved fabric lots...</p>
                    </div>
                ) : filteredApproved.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Package className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No Approved Fabrics</h3>
                        <p className="text-muted max-w-sm mt-3 text-sm leading-relaxed">
                            {searchTerm
                                ? "No fabric lots match your search criteria."
                                : "There are currently no fabric lots cleared for cutting."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-secondary/30 text-[11px] font-black text-muted uppercase tracking-[0.1em] border-b border-border">
                                    <th className="px-6 py-5 border-b border-border">Inward Details</th>
                                    <th className="px-6 py-5 border-b border-border">Fabric Item</th>
                                    <th className="px-6 py-5 border-b border-border text-center">Lot Identity</th>
                                    <th className="px-6 py-5 border-b border-border text-center">Cutting Size</th>
                                    <th className="px-6 py-5 border-b border-border text-center">Available Qty</th>
                                    <th className="px-6 py-5 border-b border-border text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredApproved.map((item, idx) => (
                                    <tr key={item._id || idx} className="hover:bg-primary/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground text-sm uppercase">{item.challanNo}</div>
                                            <div className="text-[10px] text-muted font-medium mt-1">
                                                {item.partyName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: item.color.toLowerCase() }}></div>
                                                <div className="text-sm font-black text-primary uppercase">{item.color}</div>
                                            </div>
                                            <div className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wider">
                                                DIA: {item.diameter || 'N/A'} • {item.unit}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-[11px] font-black bg-primary/5 text-primary px-3 py-1 rounded-lg border border-primary/10 shadow-sm inline-block">
                                                {item.lotNo || item.globalLotNo || 'NO LOT'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.cuttingSize ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="text-lg font-black text-indigo-600 leading-none">{item.cuttingSize}</div>
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">CM</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Not Set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="text-lg font-black text-green-600 leading-none">{item.quantity}</div>
                                                <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-tighter">TOTAL KG</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openModal(item)}
                                                className="inline-flex items-center gap-2 px-5 py-2 bg-secondary hover:bg-primary hover:text-white text-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-border shadow-sm group-hover:scale-105 active:scale-95"
                                            >
                                                {item.cuttingSize ? 'Update Size' : 'Add Size'}
                                                <RulerIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Cutting Size Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="relative bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                    <RulerIcon className="w-4 h-4" />
                                </div>
                                <h2 className="text-xl font-bold">Set Cutting Size</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Selected Lot</p>
                                    <p className="text-sm font-bold text-foreground">{selectedItem?.lotNo || selectedItem?.globalLotNo}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Color</p>
                                    <p className="text-sm font-bold text-foreground">{selectedItem?.color}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-black uppercase text-muted ml-1 tracking-widest">Cutting Specification (CM)</label>
                                    <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">Range: 75 - 110 cm</span>
                                </div>
                                <div className="relative">
                                    <RulerIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                    <input
                                        type="number"
                                        autoFocus
                                        min="75"
                                        max="110"
                                        placeholder="Enter size between 75-110"
                                        value={cuttingSizeInput}
                                        onChange={(e) => setCuttingSizeInput(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-background border-2 border-border rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-2xl font-black text-primary placeholder:text-muted/40 placeholder:font-bold"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic ml-1">* This size is required to calculate the optimal cutting length for this fabric lot.</p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-border rounded-xl font-bold text-muted hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateCuttingSize}
                                    disabled={isUpdating || !cuttingSizeInput || Number(cuttingSizeInput) < 75 || Number(cuttingSizeInput) > 110}
                                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Size
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
